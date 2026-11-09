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

interface AppErrorExtensions {
  code?: unknown;
  field?: string;
  fields?: { field: string; message: string }[];
  retryAfter?: number;
}

export interface AppError {
  code?: ErrorCode;
  // backend text for developers and logs; the UI shows useErrorMessage() instead
  message: string;
  fieldErrors: Record<string, string>;
  retryAfter?: number;
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
    message: first.message,
    fieldErrors,
    retryAfter: extensions.retryAfter,
  };
}

export function hasErrorCode(error: unknown, code: ErrorCode): boolean {
  return (
    CombinedGraphQLErrors.is(error) &&
    error.errors.some((item) => (item.extensions as AppErrorExtensions | undefined)?.code === code)
  );
}
