'use client';

import { HttpLink } from '@apollo/client';
import {
  ApolloClient,
  ApolloNextAppProvider,
  InMemoryCache,
} from '@apollo/client-integration-nextjs';
import type { ReactNode } from 'react';

function makeClient(): ApolloClient {
  const graphqlUrl = process.env.NEXT_PUBLIC_GRAPHQL_URL;

  if (!graphqlUrl) {
    throw new Error(
      'NEXT_PUBLIC_GRAPHQL_URL is not set. Copy frontend/.env.example to frontend/.env.local',
    );
  }

  return new ApolloClient({
    cache: new InMemoryCache(),
    link: new HttpLink({ uri: graphqlUrl }),
  });
}

export function ApolloWrapper({ children }: { children: ReactNode }) {
  return <ApolloNextAppProvider makeClient={makeClient}>{children}</ApolloNextAppProvider>;
}
