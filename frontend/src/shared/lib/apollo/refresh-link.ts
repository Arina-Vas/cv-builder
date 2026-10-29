import { ErrorLink } from '@apollo/client/link/error';
import { from, switchMap, type Observable } from 'rxjs';
import type { ApolloLink } from '@apollo/client';
import { hasErrorCode } from './graphql-errors';

const SIGN_IN_ROUTE = '/login';
const NO_REFRESH_OPERATIONS = new Set(['SignIn', 'SignUp', 'Logout']);
const REFRESH_MUTATION = 'mutation Refresh { refresh }';

let refreshInFlight: Promise<boolean> | null = null;

function refreshSession(graphqlUrl: string): Promise<boolean> {
  refreshInFlight ??= fetch(graphqlUrl, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: REFRESH_MUTATION }),
  })
    .then((response) => response.json())
    .then((body: { data?: { refresh?: boolean } | null }) => body.data?.refresh === true)
    .catch(() => false)
    .finally(() => {
      refreshInFlight = null;
    });

  return refreshInFlight;
}

export function createRefreshLink(graphqlUrl: string): ApolloLink {
  return new ErrorLink(({ error, operation, forward }) => {
    const isBrowser = typeof window !== 'undefined';
    const operationName = operation.operationName ?? '';

    if (
      !isBrowser ||
      NO_REFRESH_OPERATIONS.has(operationName) ||
      !hasErrorCode(error, 'UNAUTHENTICATED')
    ) {
      return;
    }

    return from(refreshSession(graphqlUrl)).pipe(
      switchMap((refreshed): Observable<ApolloLink.Result> => {
        if (!refreshed) {
          window.location.assign(new URL(SIGN_IN_ROUTE, window.location.origin));
        }
        return forward(operation);
      }),
    );
  });
}
