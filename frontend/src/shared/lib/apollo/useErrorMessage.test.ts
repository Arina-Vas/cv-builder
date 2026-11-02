import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { IntlProvider } from '@/test/render';
import type { AppError } from './graphql-errors';
import { useErrorMessage } from './useErrorMessage';

function messageFor(error: Partial<AppError>) {
  const { result } = renderHook(() => useErrorMessage(), { wrapper: IntlProvider });
  return result.current({ message: 'raw backend text', fieldErrors: {}, ...error });
}

describe('useErrorMessage', () => {
  it('shows the generic text when there is no code (network error)', () => {
    expect(messageFor({})).toBe('Something went wrong. Please try again later');
  });

  it('never shows the raw backend text of a server error', () => {
    expect(messageFor({ code: 'INTERNAL_SERVER_ERROR' })).toBe(
      'Something went wrong. Please try again later',
    );
  });

  it.each([
    ['UNAUTHENTICATED', 'Your session has expired. Please sign in again'],
    ['FORBIDDEN', "You don't have permission to do this"],
    ['NOT_FOUND', 'This item no longer exists'],
    ['CONFLICT', 'This value is already taken'],
    ['ENTITY_IN_USE', "This item is in use and can't be deleted"],
  ] as const)('maps %s to its own text', (code, text) => {
    expect(messageFor({ code })).toBe(text);
  });

  it.each([
    [undefined, 'Too many attempts. Try again later'],
    [1, 'Too many attempts. Try again in 1 second'],
    [30, 'Too many attempts. Try again in 30 seconds'],
  ])('rate limit with retryAfter=%s → %s', (retryAfter, text) => {
    expect(messageFor({ code: 'RATE_LIMITED', retryAfter })).toBe(text);
  });
});
