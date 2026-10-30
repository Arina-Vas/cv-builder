import { ApolloClient } from '@apollo/client';
import { screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { LOGOUT } from '../../api/auth.operations';
import { LogoutButton } from './LogoutButton';

describe('LogoutButton', () => {
  it('sends LOGOUT, clears the Apollo cache and goes to Sign In', async () => {
    const clearStore = vi.spyOn(ApolloClient.prototype, 'clearStore');
    const logoutResult = vi.fn(() => ({ data: { logout: true } }));
    const { user } = renderWithProviders(<LogoutButton />, {
      mocks: [{ request: { query: LOGOUT }, result: logoutResult }],
    });

    await user.click(screen.getByRole('button', { name: 'LOGOUT' }));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(logoutResult).toHaveBeenCalledTimes(1);
    expect(clearStore).toHaveBeenCalledTimes(1);
  });

  it('still clears the cache and goes to Sign In when the request fails', async () => {
    const clearStore = vi.spyOn(ApolloClient.prototype, 'clearStore');
    const { user } = renderWithProviders(<LogoutButton />, {
      mocks: [{ request: { query: LOGOUT }, error: new Error('Network down') }],
    });

    await user.click(screen.getByRole('button', { name: 'LOGOUT' }));

    await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/login'));
    expect(clearStore).toHaveBeenCalledTimes(1);
  });
});
