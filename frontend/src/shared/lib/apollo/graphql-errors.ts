import { CombinedGraphQLErrors } from '@apollo/client/errors';

// Error format: docs/api/conventions.md#errors (backend). The code is in `extensions.code`.

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'EMAIL_NOT_VERIFIED'
  | 'NOT_FOUND'
  | 'BAD_USER_INPUT'
  | 'CONFLICT'
  | 'ENTITY_IN_USE'
  | 'RATE_LIMITED'
  | 'INTERNAL_SERVER_ERROR';

export const GENERIC_ERROR_MESSAGE = 'Something went wrong. Please try again later';

interface AppErrorExtensions {
  code?: ErrorCode;
  field?: string;
  fields?: { field: string; message: string }[];
  retryAfter?: number;
}

export interface AppError {
  code?: ErrorCode;
  message: string;
  fieldErrors: Record<string, string>;
  retryAfter?: number;
}

export function parseError(error: unknown): AppError {
  const first = CombinedGraphQLErrors.is(error) ? error.errors[0] : undefined;

  if (!first) {
    return { message: GENERIC_ERROR_MESSAGE, fieldErrors: {} };
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
    code: extensions.code,
    message: extensions.code === 'INTERNAL_SERVER_ERROR' ? GENERIC_ERROR_MESSAGE : first.message,
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
