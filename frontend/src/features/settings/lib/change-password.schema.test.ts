import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from '@/i18n/config';
import type { ValidationT } from '@/shared/lib/form';
import messages from '../../../../messages/en.json';
import { changePasswordSchema, type ChangePasswordValues } from './change-password.schema';

const t = createTranslator({
  locale: DEFAULT_LOCALE,
  messages,
  namespace: 'validation',
}) as unknown as ValidationT;

const schema = changePasswordSchema(t);

const VALID: ChangePasswordValues = {
  currentPassword: 'old-secret',
  newPassword: 'new-secret',
  confirmPassword: 'new-secret',
};

/** Field → its first error message, `{}` when the values pass */
const errorsOf = (values: Partial<ChangePasswordValues>): Record<string, string> => {
  const result = schema.safeParse({ ...VALID, ...values });
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) errors[String(issue.path[0])] ??= issue.message;
  return errors;
};

describe('changePasswordSchema', () => {
  it('accepts a filled form with a matching confirmation', () => {
    expect(errorsOf({})).toEqual({});
  });

  it('requires every field with the Settings page texts', () => {
    expect(errorsOf({ currentPassword: '', newPassword: '', confirmPassword: '' })).toEqual({
      currentPassword: 'Password is required',
      newPassword: 'New password is required',
      confirmPassword: 'Confirm password is required',
    });
  });

  it('has no minimum length for the current password, only the 128 characters cap', () => {
    expect(errorsOf({ currentPassword: 'a' })).toEqual({});
    expect(errorsOf({ currentPassword: 'x'.repeat(128) })).toEqual({});
    expect(errorsOf({ currentPassword: 'x'.repeat(129) })).toEqual({
      currentPassword: 'Password must not exceed 128 characters',
    });
  });

  it('requires a new password of 6 to 128 characters', () => {
    const withNew = (newPassword: string) =>
      errorsOf({ newPassword, confirmPassword: newPassword });

    expect(withNew('12345')).toEqual({
      newPassword: 'Password does not meet the security requirements',
    });
    expect(withNew('123456')).toEqual({});
    expect(withNew('x'.repeat(128))).toEqual({});
    expect(withNew('x'.repeat(129))).toEqual({
      newPassword: 'Password must not exceed 128 characters',
    });
  });

  it('requires the confirmation to match the new password exactly, case included', () => {
    expect(errorsOf({ confirmPassword: 'new-secreT' })).toEqual({
      confirmPassword: 'Passwords do not match',
    });
    expect(errorsOf({ confirmPassword: 'new-secret ' })).toEqual({
      confirmPassword: 'Passwords do not match',
    });
  });
});
