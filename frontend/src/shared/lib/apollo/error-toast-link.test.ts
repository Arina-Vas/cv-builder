import { ApolloClient, ApolloLink, InMemoryCache, gql } from '@apollo/client';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createErrorToastLink, NO_ERROR_TOAST } from './error-toast-link';

// Real operations from backend/schema.gql, so the IDE GraphQL plugin validates them; the response is mocked
const HEALTH = gql`
  query Health {
    health {
      status
    }
  }
`;
const DELETE_POSITION = gql`
  mutation DeletePosition {
    deletePosition(id: "position-1")
  }
`;

const graphQLResult = (code: string) => ({
  data: null,
  errors: [{ message: 'raw backend text', extensions: { code } }],
});

function createClient(response: () => ReturnType<ApolloLink.ForwardFunction>) {
  const report = vi.fn();
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([createErrorToastLink(report), new ApolloLink(response)]),
  });

  return { client, report };
}

const failWith = (code: string) => createClient(() => of(graphQLResult(code)));

describe('createErrorToastLink', () => {
  it('reports a failed mutation and still passes the error to the caller', async () => {
    const { client, report } = failWith('ENTITY_IN_USE');

    await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toSatisfy(
      CombinedGraphQLErrors.is,
    );

    expect(report).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ code: 'ENTITY_IN_USE', message: 'raw backend text' }),
    );
  });

  it.each([
    'FORBIDDEN',
    'NOT_FOUND',
    'EMAIL_NOT_VERIFIED',
    'RATE_LIMITED',
    'INTERNAL_SERVER_ERROR',
  ])('reports %s', async (code) => {
    const { client, report } = failWith(code);

    await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toThrow();

    expect(report).toHaveBeenCalledExactlyOnceWith(expect.objectContaining({ code }));
  });

  it('leaves a failed query to the page (error state with Retry)', async () => {
    const { client, report } = failWith('FORBIDDEN');

    await expect(client.query({ query: HEALTH })).rejects.toThrow();

    expect(report).not.toHaveBeenCalled();
  });

  it('skips a mutation whose component shows the error itself', async () => {
    const { client, report } = failWith('ENTITY_IN_USE');

    await expect(
      client.mutate({ mutation: DELETE_POSITION, context: NO_ERROR_TOAST }),
    ).rejects.toThrow();

    expect(report).not.toHaveBeenCalled();
  });

  it.each(['BAD_USER_INPUT', 'CONFLICT'])(
    'skips %s: it belongs under the form fields',
    async (code) => {
      const { client, report } = failWith(code);

      await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toThrow();

      expect(report).not.toHaveBeenCalled();
    },
  );

  it('skips UNAUTHENTICATED: refresh-link handles it', async () => {
    const { client, report } = failWith('UNAUTHENTICATED');

    await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toThrow();

    expect(report).not.toHaveBeenCalled();
  });

  it.each([
    ['a network failure', new TypeError('Failed to fetch')],
    [
      'a non-GraphQL HTTP error',
      new ServerError('Response not successful: Received status code 502', {
        response: new Response('', { status: 502 }),
        bodyText: '',
      }),
    ],
  ])('reports %s of a mutation without a code (generic text)', async (_, error) => {
    const { client, report } = createClient(() => throwError(() => error));

    await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toThrow();

    expect(report).toHaveBeenCalledExactlyOnceWith({ message: '', fieldErrors: {} });
  });

  it('does not report a successful mutation', async () => {
    const { client, report } = createClient(() => of({ data: { deletePosition: 'position-1' } }));

    await client.mutate({ mutation: DELETE_POSITION });

    expect(report).not.toHaveBeenCalled();
  });

  it('reports nothing on the server', async () => {
    const { client, report } = failWith('ENTITY_IN_USE');

    vi.stubGlobal('window', undefined);
    try {
      await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }

    expect(report).not.toHaveBeenCalled();
  });
});
