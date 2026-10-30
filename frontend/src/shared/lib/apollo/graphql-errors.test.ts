import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { describe, expect, it } from 'vitest';
import { hasErrorCode, parseError } from './graphql-errors';

function graphQLError(message: string, extensions: Record<string, unknown>) {
  return new CombinedGraphQLErrors({ errors: [{ message, extensions }] });
}

describe('parseError', () => {
  it('returns no code for non-GraphQL errors (network), so the UI shows the generic text', () => {
    expect(parseError(new Error('Failed to fetch'))).toEqual({ message: '', fieldErrors: {} });
  });

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
