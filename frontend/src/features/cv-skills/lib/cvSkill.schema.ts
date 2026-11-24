import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

export const cvSkillSchema = (t: ValidationT) =>
  z.object({
    skillId: requiredString(t('cvSkill.skillId.required')),
  });

export type CvSkillFormValues = z.output<ReturnType<typeof cvSkillSchema>>;
