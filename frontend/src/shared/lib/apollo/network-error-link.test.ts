import { ApolloClient, ApolloLink, InMemoryCache, gql } from '@apollo/client';
import { throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { createNetworkErrorLink, isNetworkFailure } from './network-error-link';

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

function createClient(error: unknown) {
  const onNetworkFailure = vi.fn();
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    link: ApolloLink.from([
      createNetworkErrorLink(onNetworkFailure),
      new ApolloLink(() => throwError(() => error)),
    ]),
  });

  return { client, onNetworkFailure };
}

describe('isNetworkFailure', () => {
  it('treats a failed fetch as a network failure', () => {
    expect(isNetworkFailure(new TypeError('Failed to fetch'))).toBe(true);
  });

  it('does not treat other errors as network failures', () => {
    expect(isNetworkFailure(new Error('Internal server error'))).toBe(false);
  });
});

describe('createNetworkErrorLink', () => {
  it('reports a query that could not reach the backend', async () => {
    const { client, onNetworkFailure } = createClient(new TypeError('Failed to fetch'));

    await expect(client.query({ query: HEALTH })).rejects.toThrow('Failed to fetch');

    expect(onNetworkFailure).toHaveBeenCalledOnce();
  });

  it('ignores server errors', async () => {
    const { client, onNetworkFailure } = createClient(new Error('Boom'));

    await expect(client.query({ query: HEALTH })).rejects.toThrow('Boom');

    expect(onNetworkFailure).not.toHaveBeenCalled();
  });

  it('leaves failed mutations to the form that sent them', async () => {
    const { client, onNetworkFailure } = createClient(new TypeError('Failed to fetch'));

    await expect(client.mutate({ mutation: DELETE_POSITION })).rejects.toThrow('Failed to fetch');

    expect(onNetworkFailure).not.toHaveBeenCalled();
  });
});
