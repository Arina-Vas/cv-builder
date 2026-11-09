import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

const NAME_MAX = 100; // same as the backend (MAX_NAME_LENGTH)

export const departmentSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('department.required')).max(NAME_MAX, {
      error: t('department.maxLength', { max: NAME_MAX }),
    }),
  });

export type DepartmentFormValues = z.output<ReturnType<typeof departmentSchema>>;
