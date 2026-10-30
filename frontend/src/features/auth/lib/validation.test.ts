import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { DEFAULT_LOCALE } from '@/i18n/config';
import messages from '../../../../messages/en.json';
import {
  hasErrors,
  validateCode,
  validateConfirmPassword,
  validateEmail,
  validatePassword,
  type ValidationT,
} from './validation';

const t = createTranslator({
  locale: DEFAULT_LOCALE,
  messages,
  namespace: 'validation',
}) as unknown as ValidationT;

describe('auth validation', () => {
  it.each([
    ['', 'Email is required'],
    ['   ', 'Email is required'],
    ['user@', 'Please enter a valid email address'],
    ['user@example', 'Please enter a valid email address'],
    [`${'a'.repeat(250)}@x.io`, 'Please enter a valid email address'],
    [' user@example.com ', undefined],
  ])('validateEmail(%j) → %s', (value, expected) => {
    expect(validateEmail(value, t)).toBe(expected);
  });

  it.each([
    ['', 'Password is required'],
    ['12345', 'Password must be at least 6 characters long'],
    ['123456', undefined],
    ['a'.repeat(128), undefined],
    ['a'.repeat(129), 'Password must not exceed 128 characters'],
  ])('validatePassword(%j) → %s', (value, expected) => {
    expect(validatePassword(value, t)).toBe(expected);
  });

  it('validatePassword uses a custom required message', () => {
    expect(validatePassword('', t, 'New password is required')).toBe('New password is required');
  });

  it.each([
    ['secret1', '', 'Confirm Password is required'],
    ['secret1', 'secret2', 'Passwords do not match'],
    ['secret1', 'secret1', undefined],
  ])('validateConfirmPassword(%j, %j) → %s', (password, confirm, expected) => {
    expect(validateConfirmPassword(password, confirm, t)).toBe(expected);
  });

  it.each([
    ['', 'Verification code is required'],
    ['12345', 'Please enter a valid 6-digit code'],
    ['12345a', 'Please enter a valid 6-digit code'],
    ['1234567', 'Please enter a valid 6-digit code'],
    ['123456', undefined],
  ])('validateCode(%j) → %s', (value, expected) => {
    expect(validateCode(value, t)).toBe(expected);
  });

  it('hasErrors is true only when some message is set', () => {
    expect(hasErrors({ email: undefined, password: undefined })).toBe(false);
    expect(hasErrors({ email: undefined, password: 'Password is required' })).toBe(true);
  });
});
