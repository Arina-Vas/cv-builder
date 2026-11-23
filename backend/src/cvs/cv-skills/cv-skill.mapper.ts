import type { Prisma } from '@/generated/prisma/client';
import { skillInclude, toSkill } from '@/skills/skill.mapper';
import type { CvSkill } from './models/cv-skill.model';

export const cvSkillInclude = (ownerId: string) =>
  ({
    skill: {
      include: {
        ...skillInclude,
        users: { where: { userId: ownerId }, select: { mastery: true } },
      },
    },
  }) satisfies Prisma.CvSkillInclude;

export const ownerHasSkill = (ownerId: string) =>
  ({ skill: { users: { some: { userId: ownerId } } } }) satisfies Prisma.CvSkillWhereInput;

export type CvSkillWithSkill = Prisma.CvSkillGetPayload<{
  include: ReturnType<typeof cvSkillInclude>;
}>;

export const toCvSkill = (row: CvSkillWithSkill): CvSkill => {
  const ownerSkill = row.skill.users[0];

  if (!ownerSkill) {
    throw new Error(`CvSkill ${row.id}: CV owner has no UserSkill for skill ${row.skillId}`);
  }

  return {
    id: row.id,
    skill: toSkill(row.skill),
    mastery: ownerSkill.mastery,
  };
};
