import {
  EMAIL_MAX_LENGTH,
  NAME_MAX_LENGTH,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  requiredString,
  type ValidationT,
} from '@/shared/lib/form';
import type { UserRole } from '@/gql/graphql';
import { z } from 'zod';

export const USER_ROLES = ['ADMIN', 'EMPLOYEE'] as const satisfies readonly UserRole[];

export type UserFormMode = 'create' | 'update';

export const userSchema = (t: ValidationT, mode: UserFormMode = 'create') => {
  const isCreate = mode === 'create';
  const readOnly = z.string();

  return z.object({
    email: isCreate
      ? requiredString(t('user.email.required'))
          .max(EMAIL_MAX_LENGTH, { error: t('user.email.invalid') })
          .pipe(z.email({ error: t('user.email.invalid') }))
      : readOnly,
    password: isCreate
      ? z
          .string()
          .min(1, { error: t('user.password.required') })
          .min(PASSWORD_MIN_LENGTH, {
            error: t('user.password.minLength', { min: PASSWORD_MIN_LENGTH }),
          })
          .max(PASSWORD_MAX_LENGTH, {
            error: t('user.password.maxLength', { max: PASSWORD_MAX_LENGTH }),
          })
      : readOnly,
    firstName: requiredString(t('user.firstName.required')).max(NAME_MAX_LENGTH, {
      error: t('user.firstName.maxLength', { max: NAME_MAX_LENGTH }),
    }),
    lastName: requiredString(t('user.lastName.required')).max(NAME_MAX_LENGTH, {
      error: t('user.lastName.maxLength', { max: NAME_MAX_LENGTH }),
    }),
    departmentId: requiredString(t('user.department.required')),
    positionId: requiredString(t('user.position.required')),
    role: z.enum(USER_ROLES, { error: t('user.role.required') }),
  });
};

export const profileSchema = (t: ValidationT) =>
  userSchema(t, 'update').pick({
    firstName: true,
    lastName: true,
    departmentId: true,
    positionId: true,
  });

export type ProfileFormValues = z.output<ReturnType<typeof profileSchema>>;
export type UserFormInput = z.input<ReturnType<typeof userSchema>>;
export type UserFormValues = z.output<ReturnType<typeof userSchema>>;
