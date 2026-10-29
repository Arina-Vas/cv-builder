const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const CODE_PATTERN = /^\d{6}$/;

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return 'Email is required';
  if (!EMAIL_PATTERN.test(email)) return 'Please enter a valid email address';
}

export function validatePassword(value: string, requiredMessage = 'Password is required') {
  if (!value) return requiredMessage;
  if (value.length < PASSWORD_MIN_LENGTH) return 'Password must be at least 6 characters long';
}

export function validateConfirmPassword(password: string, confirm: string) {
  if (!confirm) return 'Confirm Password is required';
  if (password !== confirm) return 'Passwords do not match';
}

export function validateCode(value: string) {
  if (!value) return 'Verification code is required';
  if (!CODE_PATTERN.test(value)) return 'Please enter a valid 6-digit code';
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
