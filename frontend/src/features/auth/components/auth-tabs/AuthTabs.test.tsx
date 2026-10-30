import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { AuthTabs } from './AuthTabs';

describe('AuthTabs', () => {
  it('marks SIGN IN as the current page on /login', () => {
    usePathname.mockReturnValue('/login');
    renderWithProviders(<AuthTabs />);

    expect(screen.getByRole('link', { name: 'SIGN IN' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'SIGN UP' })).not.toHaveAttribute('aria-current');
  });

  it('links SIGN UP to the registration page', () => {
    usePathname.mockReturnValue('/register');
    renderWithProviders(<AuthTabs />);

    const signUp = screen.getByRole('link', { name: 'SIGN UP' });
    expect(signUp).toHaveAttribute('href', '/register');
    expect(signUp).toHaveAttribute('aria-current', 'page');
  });
});
