import { requiredDate, requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

const NAME_MAX = 100; // same as the backend (MAX_NAME_LENGTH)
const DESCRIPTION_MAX = 2000; // same as the backend (DESCRIPTION_MAX)

export const projectSchema = (t: ValidationT) =>
  z
    .object({
      name: requiredString(t('project.name.required')).max(NAME_MAX, {
        error: t('project.name.maxLength', { max: NAME_MAX }),
      }),
      domain: requiredString(t('project.domain.required')).max(NAME_MAX, {
        error: t('project.domain.maxLength', { max: NAME_MAX }),
      }),
      description: requiredString(t('project.description.required')).max(DESCRIPTION_MAX, {
        error: t('project.description.maxLength', { max: DESCRIPTION_MAX }),
      }),
      technologyIds: z.array(z.string()),
      startDate: requiredDate(t('project.startDate.required')),
      endDate: requiredDate(t('project.endDate.required')),
    })
    .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
      path: ['endDate'],
      error: t('project.endDate.beforeStart'),
    });

export type ProjectFormValues = z.output<ReturnType<typeof projectSchema>>;
