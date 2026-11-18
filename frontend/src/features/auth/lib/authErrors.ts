const RESET_LINK_ERRORS = {
  'This password reset link is invalid': 'errors.resetLinkInvalid',
  'This password reset link has expired': 'errors.resetLinkExpired',
} as const;

const CODE_ERRORS = {
  'Invalid verification code': 'errors.codeInvalid',
  'Verification code has expired': 'errors.codeExpired',
  'Verification code has already been used': 'errors.codeUsed',
} as const;

type ResetLinkErrorKey = (typeof RESET_LINK_ERRORS)[keyof typeof RESET_LINK_ERRORS];
type CodeErrorKey = (typeof CODE_ERRORS)[keyof typeof CODE_ERRORS];

export function resetLinkErrorKey(message: string): ResetLinkErrorKey {
  return RESET_LINK_ERRORS[message as keyof typeof RESET_LINK_ERRORS] ?? 'errors.resetLinkInvalid';
}

export function codeErrorKey(message: string): CodeErrorKey {
  return CODE_ERRORS[message as keyof typeof CODE_ERRORS] ?? 'errors.codeInvalid';
}
