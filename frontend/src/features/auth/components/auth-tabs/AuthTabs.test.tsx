import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { AuthTabs } from './AuthTabs';

describe('AuthTabs', () => {
  it('marks Sign in as the current page on /login', () => {
    usePathname.mockReturnValue('/login');
    renderWithProviders(<AuthTabs />);

    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'Sign up' })).not.toHaveAttribute('aria-current');
  });

  it('links Sign up to the registration page', () => {
    usePathname.mockReturnValue('/register');
    renderWithProviders(<AuthTabs />);

    const signUp = screen.getByRole('link', { name: 'Sign up' });
    expect(signUp).toHaveAttribute('href', '/register');
    expect(signUp).toHaveAttribute('aria-current', 'page');
  });
});
