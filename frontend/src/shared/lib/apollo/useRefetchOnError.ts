import { useApolloClient } from '@apollo/client/react';
import type { DocumentNode } from 'graphql';
import { type ErrorCode, hasErrorCode } from '@/shared/lib/apollo/graphql-errors';

export const useRefetchOnError = (queries: DocumentNode[], codes: ErrorCode[]) => {
  const client = useApolloClient();

  return async (mutate: () => Promise<unknown>): Promise<unknown> => {
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
