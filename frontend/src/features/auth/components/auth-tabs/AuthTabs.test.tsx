import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { AuthTabs } from './AuthTabs';

describe('AuthTabs', () => {
  it('marks Sign in as the current page on /login', () => {
    usePathname.mockReturnValue('/login');
    renderWithProviders(<AuthTabs>form</AuthTabs>);

    const signIn = screen.getByRole('tab', { name: 'Sign in' });
    expect(signIn).toHaveAttribute('aria-selected', 'true');
    expect(signIn).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('tab', { name: 'Sign up' })).not.toHaveAttribute('aria-current');
  });

  it('links Sign up to the registration page', () => {
    usePathname.mockReturnValue('/register');
    renderWithProviders(<AuthTabs>form</AuthTabs>);

    const signUp = screen.getByRole('tab', { name: 'Sign up' });
    expect(signUp).toHaveAttribute('href', '/register');
    expect(signUp).toHaveAttribute('aria-selected', 'true');
    expect(signUp).toHaveAttribute('aria-current', 'page');
  });

  it('renders the auth form inside the tab panel', () => {
    usePathname.mockReturnValue('/login');
    renderWithProviders(<AuthTabs>form</AuthTabs>);

    expect(screen.getByRole('tabpanel')).toHaveTextContent('form');
  });
});
