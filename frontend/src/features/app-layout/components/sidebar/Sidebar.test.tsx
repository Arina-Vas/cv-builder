import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { UserRole } from '@/gql/graphql';
import { ME } from '@/features/auth/api/auth.operations';
import { renderWithProviders } from '@/test/render';
import { SIDEBAR_COOKIE } from '../../sidebar.constants';
import { Sidebar } from './Sidebar';

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

describe('Sidebar', () => {
  afterEach(() => {
    document.cookie = `${SIDEBAR_COOKIE}=; path=/; max-age=0`;
  });

  it('starts expanded when the cookie says so', () => {
    renderWithProviders(<Sidebar defaultCollapsed={false} />, { mocks: [meMock('EMPLOYEE')] });

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed', 'false');
  });

  it('starts collapsed when the cookie says so', () => {
    renderWithProviders(<Sidebar defaultCollapsed />, { mocks: [meMock('EMPLOYEE')] });

    const toggle = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed', 'true');
  });

  it('toggles and remembers the state in a cookie', async () => {
    const { user } = renderWithProviders(<Sidebar defaultCollapsed={false} />, {
      mocks: [meMock('EMPLOYEE')],
    });

    await user.click(screen.getByRole('button', { name: 'Collapse sidebar' }));

    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=true`);

    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument();
    expect(document.cookie).toContain(`${SIDEBAR_COOKIE}=false`);
  });

  it('shows the admin tabs once the signed-in user turns out to be an admin', async () => {
    renderWithProviders(<Sidebar defaultCollapsed={false} />, { mocks: [meMock('ADMIN')] });

    expect(screen.getByRole('link', { name: 'Employees' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Departments' })).not.toBeInTheDocument();

    expect(await screen.findByRole('link', { name: 'Departments' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Positions' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Projects' })).toBeInTheDocument();
  });

  it('never shows the admin tabs to an employee', async () => {
    renderWithProviders(<Sidebar defaultCollapsed={false} />, { mocks: [meMock('EMPLOYEE')] });

    await screen.findByRole('link', { name: 'Employees' });
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(screen.queryByRole('link', { name: 'Departments' })).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
