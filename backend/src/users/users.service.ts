import { PrismaService } from '@/prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '@/generated/prisma/client';
import type { User } from './models/user.model';
import { toUser, userInclude } from './user.mapper';

const userCredentialsSelect = { id: true, passwordHash: true } satisfies Prisma.UserSelect;
export type UserCredentials = Prisma.UserGetPayload<{ select: typeof userCredentialsSelect }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
}
