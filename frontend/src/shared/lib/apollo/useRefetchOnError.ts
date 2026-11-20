import { useApolloClient } from '@apollo/client/react';
import type { DocumentNode } from 'graphql';
import { type ErrorCode, hasErrorCode } from '@/shared/lib/apollo/graphql-errors';

export const useRefetchOnError = (queries: DocumentNode[], codes: ErrorCode[]) => {
  const client = useApolloClient();

  // R, not Promise<T>: `edit ? update() : create()` gives a union of promises, kept as is
  return async <R extends Promise<unknown>>(mutate: () => R): Promise<Awaited<R>> => {
    try {
      return await mutate();
    } catch (error) {
      if (codes.some((code) => hasErrorCode(error, code))) {
        await client.refetchQueries({ include: queries }).catch(() => {});
      }
      throw error;
    }
  };
};
