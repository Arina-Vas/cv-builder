import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CvsArgs } from '@/cvs/dto/cvs.args';
import { CvPage } from '@/cvs/models/cv-page.model';
import { Prisma } from '@/generated/prisma/client';
import { UserRole } from '@/common/graphql/enums';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { cvInclude, toCv } from '@/cvs/cv.mapper';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { CvAccessService } from '@/cvs/cv-access.service';
import type { User } from '@/users/models/user.model';
import { canManageUser } from '@/common/auth/can-manage-user';
import { UserCvsArgs } from '@/cvs/dto/user-cvs.args';
import { CreateCvInput } from '@/cvs/dto/create-cv.input';
import { Cv } from '@/cvs/models/cv.model';
import { UpdateCvInput } from '@/cvs/dto/update-cv.input';
import { containsInsensitive } from '@/common/prisma/search';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvAccess: CvAccessService,
  ) {}

  async findAll(currentUser: User, args: CvsArgs): Promise<CvPage> {
    const { search } = args;

    const whereUser: Prisma.CvWhereInput = search ? { name: containsInsensitive(search) } : {};

    if (currentUser.role !== UserRole.ADMIN) {
      return this.paginate({ userId: currentUser.id, ...whereUser }, args);
    }

    const whereAdmin: Prisma.CvWhereInput = search
      ? {
          OR: [
            { name: containsInsensitive(search) },
            { user: { email: containsInsensitive(search) } },
          ],
        }
      : {};

    return this.paginate(whereAdmin, args);
  }

  async findByUser(currentUser: User, args: UserCvsArgs): Promise<CvPage> {
    const { userId, search } = args;
    await this.assertCanManage(currentUser, userId);

    return this.paginate({ userId, ...(search && { name: containsInsensitive(search) }) }, args);
  }

  async findOne(currentUser: User, id: string): Promise<Cv> {
    return toCv(await this.cvAccess.getAccessibleCv(id, currentUser));
  }

  async create(
    currentUser: User,
    { userId, name, education, description }: CreateCvInput,
  ): Promise<Cv> {
    await this.assertCanManage(currentUser, userId);

    const row = await this.prisma.cv.create({
      data: { userId, name, education, description },
      include: cvInclude,
    });

    return toCv(row);
  }

  async update(
    currentUser: User,
    { userId, name, education, description, id }: UpdateCvInput,
  ): Promise<Cv> {
    await this.assertCanManage(currentUser, userId);

    const row = await this.prisma.cv.update({
      where: { userId, id },
      data: { name, education, description },
      include: cvInclude,
    });

    return toCv(row);
  }

  async delete(currentUser: User, id: string, userId: string): Promise<string> {
    await this.assertCanManage(currentUser, userId);

    const row = await this.prisma.cv.delete({ where: { id, userId } });

    return row.id;
  }

  private async assertCanManage(currentUser: User, userId: string) {
    if (!canManageUser(currentUser, userId)) {
      throw forbidden();
    }
    await this.assertUserExists(userId);
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!user) throw notFound('User not found');
  }

  private async paginate(
    where: Prisma.CvWhereInput,
    { sortBy, sortOrder, page, pageSize }: CvsArgs,
  ): Promise<CvPage> {
    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.cv.findMany({
        where,
        include: cvInclude,
        orderBy: [{ [sortBy]: order }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.cv.count({ where }),
    ]);

    return { items: rows.map(toCv), total, page, pageSize };
  }
}
