import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ME } from '@/features/auth/api/auth.operations';
import type { UserRole } from '@/gql/graphql';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { UserDetailsTabs } from './UserDetailsTabs';

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

const renderTabs = (role: UserRole) =>
  renderWithProviders(<UserDetailsTabs userId="42">Tab content</UserDetailsTabs>, {
    mocks: [meMock(role)],
  });

describe('UserDetailsTabs', () => {
  it('links every tab to the selected user and renders the page inside', async () => {
    usePathname.mockReturnValue('/users/42/skills');
    renderTabs('EMPLOYEE');

    expect(screen.getByRole('tab', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/users/42/profile',
    );
    expect(screen.getByRole('tab', { name: 'Skills' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('tab', { name: 'Languages' })).toHaveAttribute(
      'href',
      '/users/42/languages',
    );
    expect(screen.getByText('Tab content')).toBeInTheDocument();
  });

  it('hides the CVs tab while the role is still loading', () => {
    renderTabs('ADMIN');

    expect(screen.queryByRole('tab', { name: 'CVs' })).not.toBeInTheDocument();
  });

  it('shows the CVs tab to an admin', async () => {
    renderTabs('ADMIN');

    expect(await screen.findByRole('tab', { name: 'CVs' })).toHaveAttribute(
      'href',
      '/users/42/cvs',
    );
    expect(screen.getAllByRole('tab')).toHaveLength(4);
  });

  it('never shows the CVs tab to an employee', async () => {
    renderTabs('EMPLOYEE');

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByRole('tab', { name: 'CVs' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });
});
