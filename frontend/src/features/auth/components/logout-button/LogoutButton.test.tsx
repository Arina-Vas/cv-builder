import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { LOGOUT } from '../../api/auth.operations';
import { LogoutButton } from './LogoutButton';

describe('LogoutButton', () => {
  it('logs out and goes to Sign In', async () => {
    const { user } = renderWithProviders(<LogoutButton />, {
      mocks: [{ request: { query: LOGOUT }, result: { data: { logout: true } } }],
    });

    await user.click(screen.getByRole('button', { name: 'LOGOUT' }));

    await expect.poll(() => mockRouter.replace).toHaveBeenCalledWith('/login');
  });

  it('still goes to Sign In when the request fails', async () => {
    const { user } = renderWithProviders(<LogoutButton />, {
      mocks: [{ request: { query: LOGOUT }, error: new Error('Network down') }],
    });

    await user.click(screen.getByRole('button', { name: 'LOGOUT' }));

    await expect.poll(() => mockRouter.replace).toHaveBeenCalledWith('/login');
  });
});
