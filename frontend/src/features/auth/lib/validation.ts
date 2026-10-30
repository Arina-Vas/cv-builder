import type { useTranslations } from 'next-intl';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export type ValidationT = ReturnType<typeof useTranslations<'validation'>>;

export function validateEmail(value: string, t: ValidationT) {
  const email = value.trim();
  if (!email) return t('email.required');
  if (!EMAIL_PATTERN.test(email)) return t('email.invalid');
}

export function validatePassword(
  value: string,
  t: ValidationT,
  requiredMessage = t('password.required'),
) {
  if (!value) return requiredMessage;
  if (value.length < PASSWORD_MIN_LENGTH)
    return t('password.minLength', { min: PASSWORD_MIN_LENGTH });
}

export function validateConfirmPassword(password: string, confirm: string, t: ValidationT) {
  if (!confirm) return t('confirmPassword.required');
  if (password !== confirm) return t('confirmPassword.mismatch');
}

export function validateCode(value: string, t: ValidationT) {
  if (!value) return t('code.required');
  if (!CODE_PATTERN.test(value)) return t('code.invalid');
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
