import { NAME_MAX_LENGTH, requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

export const departmentSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('department.required')).max(NAME_MAX_LENGTH, {
      error: t('department.maxLength', { max: NAME_MAX_LENGTH }),
    }),
  });

export type DepartmentFormValues = z.output<ReturnType<typeof departmentSchema>>;
