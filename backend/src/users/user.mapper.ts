import type { User } from '@/users/models/user.model';
import type { Prisma } from '@/generated/prisma/client';
import { toDepartment } from '@/departments/department.mapper';
import { toPosition } from '@/positions/position.mapper';

export const userInclude = { department: true, position: true } satisfies Prisma.UserInclude;
export type UserWithRelations = Prisma.UserGetPayload<{ include: typeof userInclude }>;

export const toUser = (row: UserWithRelations): User => ({
  id: row.id,
  avatarUrl: row.avatarUrl,
  createdAt: row.createdAt,
  department: row.department ? toDepartment(row.department) : null,
  email: row.email,
  emailVerifiedAt: row.emailVerifiedAt,
  firstName: row.firstName,
  lastName: row.lastName,
  role: row.role,
  position: row.position ? toPosition(row.position) : null,
});
