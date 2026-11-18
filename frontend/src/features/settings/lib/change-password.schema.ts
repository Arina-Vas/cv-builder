import { z } from 'zod';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, type ValidationT } from '@/shared/lib/form';

export const changePasswordSchema = (t: ValidationT) =>
  z
    .object({
      currentPassword: z
        .string()
        .min(1, { error: t('password.required') })
        .max(PASSWORD_MAX_LENGTH, { error: t('password.maxLength', { max: PASSWORD_MAX_LENGTH }) }),
      newPassword: z
        .string()
        .min(1, { error: t('password.newRequired') })
        .min(PASSWORD_MIN_LENGTH, { error: t('changePassword.weakPassword') })
        .max(PASSWORD_MAX_LENGTH, { error: t('password.maxLength', { max: PASSWORD_MAX_LENGTH }) }),
      confirmPassword: z.string().min(1, { error: t('changePassword.confirmRequired') }),
    })
    .refine((values) => !values.confirmPassword || values.confirmPassword === values.newPassword, {
      path: ['confirmPassword'],
      error: t('confirmPassword.mismatch'),
    });

export type ChangePasswordValues = z.output<ReturnType<typeof changePasswordSchema>>;

export const EMPTY_CHANGE_PASSWORD: ChangePasswordValues = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};
