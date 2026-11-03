import type { Prisma } from '@/generated/prisma/client';
import type { UserSkill } from '@/skills/user-skills/models/user-skill.model';
import { skillInclude, toSkill } from '@/skills/skill.mapper';

export const userSkillInclude = {
  skill: { include: skillInclude },
} satisfies Prisma.UserSkillInclude;
export type UserSkillWithSkill = Prisma.UserSkillGetPayload<{ include: typeof userSkillInclude }>;

export const toUserSkill = (row: UserSkillWithSkill): UserSkill => ({
  id: row.id,
  skill: toSkill(row.skill),
  mastery: row.mastery,
});
