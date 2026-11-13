import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

const NAME_MAX = 100; // same as the backend (MAX_NAME_LENGTH)

export const skillSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('skill.name.required')).max(NAME_MAX, {
      error: t('skill.name.maxLength', { max: NAME_MAX }),
    }),
    categoryId: requiredString(t('skill.categoryId.required')),
  });

export type SkillFormValues = z.output<ReturnType<typeof skillSchema>>;
