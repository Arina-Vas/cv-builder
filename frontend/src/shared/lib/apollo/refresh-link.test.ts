import {
  ApolloClient,
  ApolloLink,
  InMemoryCache,
  gql,
  type TypedDocumentNode,
} from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createRefreshLink } from './refresh-link';

const GRAPHQL_URL = 'http://localhost:4000/graphql';

const ME: TypedDocumentNode<{ me: string }> = gql`
  query Me {
    me
  }
`;
const SIGN_IN = gql`
  mutation SignIn {
    signIn
  }
`;

const unauthenticated = {
  errors: [{ message: 'Unauthorized', extensions: { code: 'UNAUTHENTICATED' } }],
};
const forbidden = { errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }] };

function mockRefreshResponse(refresh: boolean) {
  return vi.fn(async () => Response.json({ data: { refresh } }));
}

// Terminating link: answers each request with the next response from the list.
// An extra request (e.g. a second retry) fails loudly instead of hanging until the test times out.
function createClient(responses: ApolloLink.Result[], onSessionExpired = vi.fn()) {
  const backend = vi.fn(() => {
    const response = responses.shift();
    return response ? of(response) : throwError(() => new Error('Unexpected extra request'));
  });

  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      createRefreshLink(GRAPHQL_URL, onSessionExpired),
      new ApolloLink(backend),
    ]),
  });

  return { client, backend, onSessionExpired };
}

describe('createRefreshLink', () => {
  let fetchMock: ReturnType<typeof mockRefreshResponse>;

  beforeEach(() => {
    fetchMock = mockRefreshResponse(true);
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('refreshes the session once and retries the request on UNAUTHENTICATED', async () => {
    const { client, backend, onSessionExpired } = createClient([
      unauthenticated,
      { data: { me: 'user' } },
    ]);

    const result = await client.query({ query: ME, fetchPolicy: 'no-cache' });

    expect(result.data).toEqual({ me: 'user' });
    expect(backend).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      GRAPHQL_URL,
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: expect.stringContaining('refresh'),
      }),
    );
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('shares one refresh between parallel requests', async () => {
    const { client, backend } = createClient([
      unauthenticated,
      unauthenticated,
      { data: { me: 'a' } },
      { data: { me: 'b' } },
    ]);

    // Different variables keep Apollo from deduplicating the two queries into one request;
    // without them this test would pass even if every request ran its own refresh.
    const results = await Promise.all([
      client.query({ query: ME, fetchPolicy: 'no-cache', variables: { n: 1 } }),
      client.query({ query: ME, fetchPolicy: 'no-cache', variables: { n: 2 } }),
    ]);

    expect(results.map((result) => result.data?.me).sort()).toEqual(['a', 'b']);
    expect(backend).toHaveBeenCalledTimes(4);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('sends the user to Sign In and rethrows when the refresh is rejected', async () => {
    fetchMock = mockRefreshResponse(false);
    vi.stubGlobal('fetch', fetchMock);
    const { client, backend, onSessionExpired } = createClient([unauthenticated]);

    const error = await client.query({ query: ME, fetchPolicy: 'no-cache' }).catch((e) => e);

    expect(CombinedGraphQLErrors.is(error)).toBe(true);
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
    expect(backend).toHaveBeenCalledTimes(1);
  });

  it('treats a network failure of the refresh as an expired session', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new TypeError('Failed to fetch');
      }),
    );
    const { client, onSessionExpired } = createClient([unauthenticated]);

    await expect(client.query({ query: ME, fetchPolicy: 'no-cache' })).rejects.toThrow(
      'Unauthorized',
    );
    expect(onSessionExpired).toHaveBeenCalledTimes(1);
  });

  it('does not refresh for SignIn: wrong credentials are not an expired session', async () => {
    const { client, onSessionExpired } = createClient([unauthenticated]);

    await expect(client.mutate({ mutation: SIGN_IN })).rejects.toThrow('Unauthorized');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(onSessionExpired).not.toHaveBeenCalled();
  });

  it('passes other errors through without a refresh', async () => {
    const { client, backend } = createClient([forbidden]);

    await expect(client.query({ query: ME, fetchPolicy: 'no-cache' })).rejects.toThrow('Forbidden');
    expect(fetchMock).not.toHaveBeenCalled();
    expect(backend).toHaveBeenCalledTimes(1);
  });
});
