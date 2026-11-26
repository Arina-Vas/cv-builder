import { CombinedGraphQLErrors } from '@apollo/client/errors';

// Error format: docs/api/conventions.md#errors (backend). The code is in `extensions.code`.
// Codes the backend sends in extensions.code: backend/src/common/errors/error-code.enum.ts

export const ERROR_CODES = [
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'EMAIL_NOT_VERIFIED',
  'NOT_FOUND',
  'BAD_USER_INPUT',
  'CONFLICT',
  'ENTITY_IN_USE',
  'OPERATION_NOT_ALLOWED',
  'RATE_LIMITED',
  'INTERNAL_SERVER_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

export const isErrorCode = (value: unknown): value is ErrorCode =>
  typeof value === 'string' && (ERROR_CODES as readonly string[]).includes(value);

// Reasons the backend sends in extensions.reason: backend/src/common/errors/error-reason.enum.ts
export const ERROR_REASONS = [
  'INVALID',
  'EXPIRED',
  'USED',
  'TOO_LARGE',
  'INVALID_TYPE',
  'SELF',
  'LAST_ADMIN',
] as const;

export type ErrorReason = (typeof ERROR_REASONS)[number];

export const isErrorReason = (value: unknown): value is ErrorReason =>
  typeof value === 'string' && (ERROR_REASONS as readonly string[]).includes(value);

interface AppErrorExtensions {
  code?: unknown;
  reason?: unknown;
  field?: string;
  fields?: { field: string; message: string }[];
  retryAfter?: number;
  ids?: string[];
}

export interface AppError {
  code?: ErrorCode;
  reason?: ErrorReason;
  // backend text for developers and logs; the UI shows useErrorMessage() instead
  message: string;
  fieldErrors: Record<string, string>;
  retryAfter?: number;
  ids?: string[];
}

export function parseError(error: unknown): AppError {
  const first = CombinedGraphQLErrors.is(error) ? error.errors[0] : undefined;

  if (!first) {
    return { message: '', fieldErrors: {} };
  }

  const extensions = (first.extensions ?? {}) as AppErrorExtensions;
  const fieldErrors: Record<string, string> = {};

  for (const { field, message } of extensions.fields ?? []) {
    fieldErrors[field] ??= message;
  }
  if (extensions.field) {
    fieldErrors[extensions.field] ??= first.message;
  }

  return {
    code: isErrorCode(extensions.code) ? extensions.code : undefined,
    reason: isErrorReason(extensions.reason) ? extensions.reason : undefined,
    message: first.message,
    fieldErrors,
    retryAfter: extensions.retryAfter,
    ids: Array.isArray(extensions.ids) ? extensions.ids : undefined,
  };
}

// The page's text for a cause within a code: { OPERATION_NOT_ALLOWED: { SELF: '…', LAST_ADMIN: '…' } }.
// Keyed by code first: reasons are shared values (INVALID, SELF) and must not match another code.
export type ReasonMessages = Partial<Record<ErrorCode, Partial<Record<ErrorReason, string>>>>;

export function reasonMessage(
  { code, reason }: AppError,
  messages: ReasonMessages | undefined,
): string | undefined {
  return code && reason ? messages?.[code]?.[reason] : undefined;
}

export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((item) => (item.extensions as AppErrorExtensions | undefined)?.code === code)
  );
}
