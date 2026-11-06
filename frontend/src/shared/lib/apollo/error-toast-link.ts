import type { ApolloLink } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { OperationTypeNode } from 'graphql';
import { apiErrors } from './api-errors';
import { hasErrorCode, parseError, type AppError, type ErrorCode } from './graphql-errors';

declare module '@apollo/client' {
  interface DefaultContext {
    /** The component shows this error itself (form, dialog): no global toast */
    skipErrorToast?: boolean;
  }
}

/** `useMutation(DOC, { context: NO_ERROR_TOAST })` when the component shows the error itself */
export const NO_ERROR_TOAST = { skipErrorToast: true } as const;

// Shown under the form fields (wiki: "validation errors are displayed inline"), never as a toast
const FIELD_ERROR_CODES: readonly ErrorCode[] = ['BAD_USER_INPUT', 'CONFLICT'];

/**
 * Reports failed *mutations* nobody shows locally, so ApiErrorToaster shows them as toasts.
 * A failed query is the page's error state with Retry (and No Internet for a network failure), not a toast.
 * First in the chain: it sees the final error, after refresh-link has refreshed and repeated the request.
 */
export function createErrorToastLink(
  report: (error: AppError) => void = apiErrors.report,
): ApolloLink {
  return new ErrorLink(({ error, operation }) => {
    if (typeof window === 'undefined') return;
    if (operation.operationType !== OperationTypeNode.MUTATION) return;
    if (operation.getContext().skipErrorToast) return;
    // refresh-link either repeated the request or is redirecting to Sign In
    if (hasErrorCode(error, 'UNAUTHENTICATED')) return;

    const appError = parseError(error);
    if (appError.code && FIELD_ERROR_CODES.includes(appError.code)) return;

    report(appError);
  });
}
