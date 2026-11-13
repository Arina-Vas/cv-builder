import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';
import { MASTERIES } from '@/features/skills/user-skills/lib/mastery';

export const userSkillSchema = (t: ValidationT) =>
  z.object({
    skillId: requiredString(t('userSkill.skillId.required')),
    mastery: requiredString(t('userSkill.mastery.required')).pipe(z.enum(MASTERIES)),
  });

export type UserSkillFormValues = z.output<ReturnType<typeof userSkillSchema>>;
