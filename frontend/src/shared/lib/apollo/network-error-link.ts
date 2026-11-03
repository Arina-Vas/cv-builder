import type { ApolloLink } from '@apollo/client';
import { ErrorLink } from '@apollo/client/link/error';
import { OperationTypeNode } from 'graphql';
import { networkStatus } from '@/shared/lib/network/network-status';

// fetch() rejects with a TypeError when the request never reached the server
// (offline, DNS, connection refused, CORS). HTTP and GraphQL errors are not network failures.
export function isNetworkFailure(error: unknown): boolean {
  return error instanceof TypeError;
}

/**
 * Reports failed *queries* so the app shows the No Internet page.
 * Mutations keep their inline "Something went wrong" message and the form values.
 */
export function createNetworkErrorLink(
  onNetworkFailure: () => void = networkStatus.reportFailure,
): ApolloLink {
  return new ErrorLink(({ error, operation }) => {
    if (operation.operationType === OperationTypeNode.QUERY && isNetworkFailure(error)) {
      onNetworkFailure();
    }
  });
}
