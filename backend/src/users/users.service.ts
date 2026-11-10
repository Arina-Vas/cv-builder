import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/generated/prisma/client';
import type { User } from './models/user.model';
import { toUser, userInclude } from './user.mapper';
import type { UserPage } from './models/user-page.model';
import type { UsersArgs } from './dto/users.args';
import { UserSortField } from './models/user-sort-field.enum';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { UserRole } from '@/common/graphql/enums';
import type { CreateUserInput } from './dto/create-user.input';
import type { UpdateUserInput } from './dto/update-user.input';
import { hashPassword } from '@/common/crypto/password';
import {
  badUserInput,
  conflict,
  notFound,
  operationNotAllowed,
  type FieldError,
} from '@/common/errors/app-errors';
import { isPrismaError } from '@/prisma/prisma-errors';

import { UserMessage } from './user.messages';

const userCredentialsSelect = { id: true, passwordHash: true } satisfies Prisma.UserSelect;
export type UserCredentials = Prisma.UserGetPayload<{ select: typeof userCredentialsSelect }>;

const countAdmins = (tx: Prisma.TransactionClient): Promise<number> =>
  tx.user.count({ where: { role: UserRole.ADMIN } });

const toUserOrderBy = (
  sortBy: UserSortField | undefined,
  order: Prisma.SortOrder,
): Prisma.UserOrderByWithRelationInput[] => {
  switch (sortBy) {
    case undefined:
      return [{ createdAt: 'asc' }, { id: 'asc' }];
    case UserSortField.firstName:
      return [{ firstName: { sort: order, nulls: 'last' } }, { id: 'asc' }];
    case UserSortField.lastName:
      return [{ lastName: { sort: order, nulls: 'last' } }, { id: 'asc' }];
    case UserSortField.department:
      return [{ department: { name: order } }, { id: 'asc' }];
    case UserSortField.position:
      return [{ position: { name: order } }, { id: 'asc' }];
  }
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ search, sortBy, sortOrder, page, pageSize }: UsersArgs): Promise<UserPage> {
    const where: Prisma.UserWhereInput = search
      ? {
          OR: [
            { firstName: { contains: search, mode: 'insensitive' } },
            { lastName: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: toUserOrderBy(sortBy, order),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.user.count({ where }),
    ]);

    return { items: rows.map(toUser), page, pageSize, total };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw notFound(UserMessage.notFound);
    }

    return user;
  }

  async createUser({ password, ...data }: CreateUserInput): Promise<User> {
    await this.assertDepartmentAndPositionExist(data.departmentId, data.positionId);
    const passwordHash = await hashPassword(password);

    try {
      const row = await this.prisma.user.create({
        data: { ...data, passwordHash },
        include: userInclude,
      });

      return toUser(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw conflict('email', UserMessage.emailTaken);
      }
      throw error;
    }
  }

  async update(
    { id, firstName, lastName, departmentId, positionId, role }: UpdateUserInput,
    currentUserId: string,
  ): Promise<User> {
    await this.assertDepartmentAndPositionExist(departmentId, positionId);

    return this.prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (!target) {
          throw notFound(UserMessage.notFound);
        }

        if (target.role !== role) {
          if (id === currentUserId) {
            throw operationNotAllowed(UserMessage.ownRoleChange);
          }
          if (target.role === UserRole.ADMIN && (await countAdmins(tx)) <= 1) {
            throw operationNotAllowed(UserMessage.lastAdminDemote);
          }
        }

        const row = await tx.user.update({
          where: { id },
          data: { firstName, lastName, departmentId, positionId, role },
          include: userInclude,
        });

        return toUser(row);
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async delete(id: string, currentUserId: string): Promise<string> {
    if (id === currentUserId) {
      throw operationNotAllowed(UserMessage.ownAccountDelete);
    }

    return this.prisma.$transaction(
      async (tx) => {
        const target = await tx.user.findUnique({ where: { id }, select: { role: true } });
        if (!target) {
          throw notFound(UserMessage.notFound);
        }
        if (target.role === UserRole.ADMIN && (await countAdmins(tx)) <= 1) {
          throw operationNotAllowed(UserMessage.lastAdminDelete);
        }

        await tx.user.delete({ where: { id } });

        return id;
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id }, include: userInclude });

    return row ? toUser(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email }, include: userInclude });

    return row ? toUser(row) : null;
  }

  async create(data: { email: string; passwordHash: string }): Promise<User> {
    const row = await this.prisma.user.create({ data, include: userInclude });

    return toUser(row);
  }

  findWithPasswordHashByEmail(email: string): Promise<UserCredentials | null> {
    return this.prisma.user.findUnique({ where: { email }, select: userCredentialsSelect });
  }

  private async assertDepartmentAndPositionExist(
    departmentId: string,
    positionId: string,
  ): Promise<void> {
    const [department, position] = await Promise.all([
      this.prisma.department.findUnique({ where: { id: departmentId }, select: { id: true } }),
      this.prisma.position.findUnique({ where: { id: positionId }, select: { id: true } }),
    ]);

    const fields: FieldError[] = [];
    if (!department) {
      fields.push({ field: 'departmentId', message: UserMessage.departmentNotFound });
    }
    if (!position) {
      fields.push({ field: 'positionId', message: UserMessage.positionNotFound });
    }
    if (fields.length > 0) {
      throw badUserInput(fields);
    }
  }
}
