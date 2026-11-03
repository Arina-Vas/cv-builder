import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ME } from '@/features/auth/api/auth.operations';
import type { UserRole } from '@/gql/graphql';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { AdminGuard } from './AdminGuard';

const meMock = (role: UserRole) => ({
  request: { query: ME },
  result: {
    data: {
      me: {
        __typename: 'User' as const,
        id: '1',
        email: 'user@example.test',
        role,
        emailVerifiedAt: null,
        firstName: 'Ada',
        lastName: 'Lovelace',
        avatarUrl: null,
      },
    },
  },
});

describe('AdminGuard', () => {
  it('renders nothing while the role is still loading', () => {
    renderWithProviders(<AdminGuard>Admin page</AdminGuard>, { mocks: [meMock('ADMIN')] });

    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });

  it('renders the page for an admin', async () => {
    renderWithProviders(<AdminGuard>Admin page</AdminGuard>, { mocks: [meMock('ADMIN')] });

    expect(await screen.findByText('Admin page')).toBeInTheDocument();
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  it('sends an employee home with a toast and never renders the page', async () => {
    renderWithProviders(<AdminGuard>Admin page</AdminGuard>, { mocks: [meMock('EMPLOYEE')] });

    expect(
      await screen.findByText('You are not authorized to access this page'),
    ).toBeInTheDocument();
    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/'));
    expect(mockRouter.replace).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('Admin page')).not.toBeInTheDocument();
  });
});
