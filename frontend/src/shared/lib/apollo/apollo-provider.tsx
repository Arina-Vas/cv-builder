'use client';

import { ApolloLink } from '@apollo/client';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';
import UploadHttpLink from 'apollo-upload-client/UploadHttpLink.mjs';
import type { ReactNode } from 'react';
import { createErrorToastLink } from './error-toast-link';
import { createNetworkErrorLink } from './network-error-link';
import { createRefreshLink } from './refresh-link';

function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (!graphqlUrl) {
    throw new Error(
      'NEXT_PUBLIC_GRAPHQL_URL is not set. Copy frontend/.env.example to frontend/.env.local',
    );
  }

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      // first: errors come back right to left, so it sees the final one (after refresh and retry)
      createErrorToastLink(),
      createNetworkErrorLink(),
      createRefreshLink(graphqlUrl),
      // Works like HttpLink; an operation with a File in its variables goes as a multipart request.
      // The header lets such a request through the CSRF protection of Apollo Server.
      new UploadHttpLink({
        uri: graphqlUrl,
        credentials: 'include',
        headers: { 'apollo-require-preflight': 'true' },
      }),
    ]),
  });
}

export function ApolloWrapper({ children }: { children: ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
