import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';
import { MASTERIES } from '@/features/skills/user-skills/lib/mastery';

export const cvSkillSchema = (t: ValidationT) =>
  z.object({
    skillId: requiredString(t('cvSkill.skillId.required')),
  });

export type CvSkillFormValues = z.output<ReturnType<typeof cvSkillSchema>>;

export const cvSkillUpdateSchema = (t: ValidationT) =>
  z.object({
    mastery: requiredString(t('cvSkill.mastery.required')).pipe(z.enum(MASTERIES)),
  });

export type CvSkillUpdateFormValues = z.output<ReturnType<typeof cvSkillUpdateSchema>>;
