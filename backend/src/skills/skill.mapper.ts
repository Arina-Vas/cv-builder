import { type Skill } from '@/skills/models/skill.model';
import type { SkillCategory as SkillCategoryEntity, Prisma } from '@/generated/prisma/client';
import type { SkillCategory } from '@/skills/models/skill-category.model';

export const skillInclude = { category: true } satisfies Prisma.SkillInclude;
export type SkillWithCategory = Prisma.SkillGetPayload<{ include: typeof skillInclude }>;

export const toSkillCategory = (row: SkillCategoryEntity): SkillCategory => ({
  name: row.name,
  id: row.id,
  type: row.type,
});

export const toSkill = (row: SkillWithCategory): Skill => ({
  category: toSkillCategory(row.category),
  id: row.id,
  name: row.name,
});
