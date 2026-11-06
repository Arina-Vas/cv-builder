import { act, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { ApiErrorToaster } from './ApiErrorToaster';
import { apiErrors } from './api-errors';
import type { AppError } from './graphql-errors';

const report = (error: Partial<AppError>) =>
  act(() => apiErrors.report({ message: 'raw backend text', fieldErrors: {}, ...error }));

describe('ApiErrorToaster', () => {
  it('shows a reported error as an error toast with our text, not the backend one', () => {
    renderWithProviders(<ApiErrorToaster />);

    report({ code: 'ENTITY_IN_USE' });

    expect(screen.getByText("This item is in use and can't be deleted")).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.queryByText('raw backend text')).not.toBeInTheDocument();
  });

  it('shows the generic text when the error has no code', () => {
    renderWithProviders(<ApiErrorToaster />);

    report({});

    expect(screen.getByText('Something went wrong. Please try again later')).toBeInTheDocument();
  });

  it('shows one toast when several requests fail with the same text', () => {
    renderWithProviders(<ApiErrorToaster />);

    report({ code: 'FORBIDDEN' });
    report({ code: 'FORBIDDEN' });
    // no code and INTERNAL_SERVER_ERROR give the same text, so they are one toast too
    report({});
    report({ code: 'INTERNAL_SERVER_ERROR' });

    expect(screen.getAllByText("You don't have permission to do this")).toHaveLength(1);
    expect(screen.getAllByText('Something went wrong. Please try again later')).toHaveLength(1);
  });

  it('passes retryAfter into the rate limit text', () => {
    renderWithProviders(<ApiErrorToaster />);

    report({ code: 'RATE_LIMITED', retryAfter: 5 });

    expect(screen.getByText('Too many attempts. Try again in 5 seconds')).toBeInTheDocument();
  });

  it('shows an error reported before it was mounted', () => {
    report({ code: 'FORBIDDEN' });

    renderWithProviders(<ApiErrorToaster />);

    expect(screen.getByText("You don't have permission to do this")).toBeInTheDocument();
  });

  it('stops showing errors after unmount', () => {
    const { unmount } = renderWithProviders(<ApiErrorToaster />);
    unmount();

    report({ code: 'NOT_FOUND' });
    // the error waits in the queue now; the next mount shows it and empties the queue
    renderWithProviders(<ApiErrorToaster />);

    expect(screen.getAllByText('This item no longer exists')).toHaveLength(1);
  });
});
