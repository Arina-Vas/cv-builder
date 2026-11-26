import type { ErrorReason } from '@/shared/lib/apollo/graphql-errors';

const RESET_LINK_ERRORS = {
  INVALID: 'errors.resetLinkInvalid',
  EXPIRED: 'errors.resetLinkExpired',
} as const satisfies Partial<Record<ErrorReason, string>>;

const CODE_ERRORS = {
  INVALID: 'errors.codeInvalid',
  EXPIRED: 'errors.codeExpired',
  USED: 'errors.codeUsed',
} as const satisfies Partial<Record<ErrorReason, string>>;

type ResetLinkErrorKey = (typeof RESET_LINK_ERRORS)[keyof typeof RESET_LINK_ERRORS];
type CodeErrorKey = (typeof CODE_ERRORS)[keyof typeof CODE_ERRORS];

const lookup = <K extends string>(map: Partial<Record<ErrorReason, K>>, reason?: ErrorReason) =>
  reason ? map[reason] : undefined;

export function resetLinkErrorKey(reason?: ErrorReason): ResetLinkErrorKey {
  return lookup(RESET_LINK_ERRORS, reason) ?? 'errors.resetLinkInvalid';
}

export function codeErrorKey(reason?: ErrorReason): CodeErrorKey {
  return lookup(CODE_ERRORS, reason) ?? 'errors.codeInvalid';
}
