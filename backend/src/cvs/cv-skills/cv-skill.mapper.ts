import type { Prisma } from '@/generated/prisma/client';
import { skillInclude, toSkill } from '@/skills/skill.mapper';
import type { CvSkill } from './models/cv-skill.model';

export const cvSkillInclude = {
  skill: { include: skillInclude },
} satisfies Prisma.CvSkillInclude;

export const ownerHasSkill = (ownerId: string) =>
  ({ skill: { users: { some: { userId: ownerId } } } }) satisfies Prisma.CvSkillWhereInput;

export type CvSkillWithSkill = Prisma.CvSkillGetPayload<{ include: typeof cvSkillInclude }>;

export const toCvSkill = (row: CvSkillWithSkill): CvSkill => ({
  id: row.id,
  skill: toSkill(row.skill),
  mastery: row.mastery,
});
