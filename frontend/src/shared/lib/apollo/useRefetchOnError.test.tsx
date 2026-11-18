import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { useApolloClient } from '@apollo/client/react';
import { MockedProvider } from '@apollo/client/testing/react';
import { renderHook } from '@testing-library/react';
import { parse } from 'graphql';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { ErrorCode } from './graphql-errors';
import { useRefetchOnError } from './useRefetchOnError';

const LIST = parse('query List { list }');
const OPTIONS = parse('query Options { options }');

const graphQLError = (code: string) =>
  new CombinedGraphQLErrors({ errors: [{ message: 'raw backend text', extensions: { code } }] });

const setup = (codes: ErrorCode[] = ['CONFLICT', 'NOT_FOUND']) => {
  const { result } = renderHook(
    () => ({ client: useApolloClient(), withRefetch: useRefetchOnError([LIST, OPTIONS], codes) }),
    {
      wrapper: ({ children }: { children: ReactNode }) => (
        <MockedProvider>{children}</MockedProvider>
      ),
    },
  );
  const { client, withRefetch } = result.current;
  const refetchQueries = vi.spyOn(client, 'refetchQueries');

  return { withRefetch, refetchQueries };
};

describe('useRefetchOnError', () => {
  it('returns the mutation result and refetches nothing on success', async () => {
    const { withRefetch, refetchQueries } = setup();

    await expect(withRefetch(() => Promise.resolve('done'))).resolves.toBe('done');
    expect(refetchQueries).not.toHaveBeenCalled();
  });

  it.each(['CONFLICT', 'NOT_FOUND'])(
    'refetches the queries after %s and rethrows the error',
    async (code) => {
      const { withRefetch, refetchQueries } = setup();
      const error = graphQLError(code);

      await expect(withRefetch(() => Promise.reject(error))).rejects.toBe(error);
      expect(refetchQueries).toHaveBeenCalledWith({ include: [LIST, OPTIONS] });
    },
  );

  it('only refetches for the codes it was given', async () => {
    const { withRefetch, refetchQueries } = setup(['NOT_FOUND']);
    const error = graphQLError('CONFLICT');

    await expect(withRefetch(() => Promise.reject(error))).rejects.toBe(error);
    expect(refetchQueries).not.toHaveBeenCalled();
  });

  it.each([
    ['another code', graphQLError('FORBIDDEN')],
    ['a network failure', new TypeError('Failed to fetch')],
  ])('does not refetch after %s', async (_, error) => {
    const { withRefetch, refetchQueries } = setup();

    await expect(withRefetch(() => Promise.reject(error))).rejects.toBe(error);
    expect(refetchQueries).not.toHaveBeenCalled();
  });

  it('rethrows the mutation error even when the refetch fails', async () => {
    const { withRefetch, refetchQueries } = setup();
    const error = graphQLError('NOT_FOUND');
    refetchQueries.mockReturnValue(
      Object.assign(Promise.reject(graphQLError('NOT_FOUND')), { queries: [], results: [] }),
    );

    await expect(withRefetch(() => Promise.reject(error))).rejects.toBe(error);
  });
});
