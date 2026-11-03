import { ApolloClient } from '@apollo/client';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LOGOUT } from '@/features/auth/api/auth.operations';
import type { MeQuery } from '@/gql/graphql';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { ProfileMenu } from './ProfileMenu';

const user: MeQuery['me'] = {
  id: '7',
  email: 'ada@example.test',
  role: 'EMPLOYEE',
  emailVerifiedAt: null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  avatarUrl: null,
};

const logoutMock = { request: { query: LOGOUT }, result: { data: { logout: true } } };

describe('ProfileMenu', () => {
  it('shows the full name and opens the menu on click', async () => {
    const { user: events } = renderWithProviders(<ProfileMenu user={user} collapsed={false} />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    await events.click(screen.getByRole('button', { name: /Ada Lovelace/ }));

    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'Profile',
      'Settings',
      'Logout',
    ]);
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('falls back to the email when the name is empty', () => {
    renderWithProviders(
      <ProfileMenu user={{ ...user, firstName: null, lastName: null }} collapsed={false} />,
    );

    expect(screen.getByRole('button', { name: /ada@example.test/ })).toBeInTheDocument();
  });

  it('links to the own profile and to settings', async () => {
    const { user: events } = renderWithProviders(<ProfileMenu user={user} collapsed={false} />);

    await events.click(screen.getByRole('button', { name: /Ada Lovelace/ }));

    expect(screen.getByRole('menuitem', { name: 'Profile' })).toHaveAttribute(
      'href',
      '/users/7/profile',
    );
    expect(screen.getByRole('menuitem', { name: 'Settings' })).toHaveAttribute('href', '/settings');
  });

  it('keeps the item names for screen readers when collapsed', async () => {
    const { user: events } = renderWithProviders(<ProfileMenu user={user} collapsed />);

    await events.click(screen.getByRole('button', { name: /Ada Lovelace/ }));

    expect(screen.getByRole('menu')).toHaveAttribute('data-collapsed', 'true');
    expect(screen.getByRole('menuitem', { name: 'Logout' })).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    const { user: events } = renderWithProviders(<ProfileMenu user={user} collapsed={false} />);

    await events.click(screen.getByRole('button', { name: /Ada Lovelace/ }));
    await events.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('logs out, clears the Apollo cache and goes to Sign In', async () => {
    const clearStore = vi.spyOn(ApolloClient.prototype, 'clearStore');
    const { user: events } = renderWithProviders(<ProfileMenu user={user} collapsed={false} />, {
      mocks: [logoutMock],
    });

    await events.click(screen.getByRole('button', { name: /Ada Lovelace/ }));
    await events.click(screen.getByRole('menuitem', { name: 'Logout' }));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(clearStore).toHaveBeenCalledTimes(1);
  });
});
