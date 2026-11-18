import type { Prisma } from '@/generated/prisma/client';
import type { Cv } from '@/cvs/models/cv.model';
import { toUser, userInclude } from '@/users/user.mapper';

export const cvInclude = {
  user: { include: userInclude },
} satisfies Prisma.CvInclude;
export type CvWithUser = Prisma.CvGetPayload<{ include: typeof cvInclude }>;

export const toCv = (row: CvWithUser): Cv => ({
  id: row.id,
  name: row.name,
  education: row.education,
  description: row.description,
  user: toUser(row.user),
});
