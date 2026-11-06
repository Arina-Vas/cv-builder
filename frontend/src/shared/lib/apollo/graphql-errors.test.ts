import { CombinedGraphQLErrors, ServerError, ServerParseError } from '@apollo/client/errors';
import { describe, expect, it } from 'vitest';
import { hasErrorCode, isErrorCode, parseError } from './graphql-errors';

function graphQLError(message: string, extensions: Record<string, unknown>) {
  return new CombinedGraphQLErrors({ errors: [{ message, extensions }] });
}

const proxyPage = '<html lang="en"><body>502 Bad Gateway</body></html>';

describe('parseError', () => {
  // No code → useErrorMessage shows errors.INTERNAL_SERVER_ERROR. A failed query also opens the
  // No Internet page (network-error-link), so there is no separate network text.
  it.each([
    ['a network failure (fetch rejects with TypeError)', new TypeError('Failed to fetch')],
    [
      'a non-GraphQL HTTP error (ServerError)',
      new ServerError('Response not successful: Received status code 502', {
        response: new Response(proxyPage, { status: 502 }),
        bodyText: proxyPage,
      }),
    ],
    [
      'a body that is not JSON (ServerParseError)',
      new ServerParseError(new SyntaxError('Unexpected token <'), {
        response: new Response(proxyPage, { status: 200 }),
        bodyText: proxyPage,
      }),
    ],
    ['any other error', new Error('boom')],
  ])('returns no code for %s, so the UI shows the generic text', (_, error) => {
    expect(parseError(error)).toEqual({ message: '', fieldErrors: {} });
  });

  it.each([['GRAPHQL_VALIDATION_FAILED'], ['BAD_REQUEST'], [42], [null]])(
    'drops an unknown code %j, so the UI shows the fallback text',
    (code) => {
      const error = graphQLError('Cannot query field "foo"', { code });

      expect(parseError(error)).toMatchObject({
        code: undefined,
        message: 'Cannot query field "foo"',
      });
    },
  );

  it('collects field messages from extensions.fields, first message per field wins', () => {
    const error = graphQLError('Validation failed', {
      code: 'BAD_USER_INPUT',
      fields: [
        { field: 'email', message: 'Email is required' },
        { field: 'email', message: 'Second message' },
        { field: 'password', message: 'Password is required' },
      ],
    });

    expect(parseError(error)).toMatchObject({
      code: 'BAD_USER_INPUT',
      fieldErrors: { email: 'Email is required', password: 'Password is required' },
    });
  });

  it('maps a single extensions.field to the error message', () => {
    const error = graphQLError('An account with this email already exists', {
      code: 'CONFLICT',
      field: 'email',
    });

    expect(parseError(error).fieldErrors).toEqual({
      email: 'An account with this email already exists',
    });
  });

  it('keeps the backend message for developers; the UI text comes from useErrorMessage', () => {
    const error = graphQLError('relation "users" does not exist', {
      code: 'INTERNAL_SERVER_ERROR',
    });

    expect(parseError(error)).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'relation "users" does not exist',
    });
  });

  it('passes retryAfter through for rate limits', () => {
    const error = graphQLError('Please wait', { code: 'RATE_LIMITED', retryAfter: 42 });

    expect(parseError(error)).toMatchObject({ code: 'RATE_LIMITED', retryAfter: 42 });
  });
});

describe('hasErrorCode', () => {
  it('finds the code among GraphQL errors', () => {
    const error = graphQLError('Unauthorized', { code: 'UNAUTHENTICATED' });

    expect(hasErrorCode(error, 'UNAUTHENTICATED')).toBe(true);
    expect(hasErrorCode(error, 'FORBIDDEN')).toBe(false);
  });

  it('is false for other errors', () => {
    expect(hasErrorCode(new Error('boom'), 'UNAUTHENTICATED')).toBe(false);
  });
});

describe('isErrorCode', () => {
  it('accepts a backend code', () => {
    expect(isErrorCode('ENTITY_IN_USE')).toBe(true);
  });

  it.each([['GRAPHQL_PARSE_FAILED'], ['entity_in_use'], [''], [undefined], [42]])(
    'rejects %j',
    (value) => {
      expect(isErrorCode(value)).toBe(false);
    },
  );
});
