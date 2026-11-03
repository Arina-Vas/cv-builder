import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { UserRole } from '@/gql/graphql';
import { ME } from '@/features/auth/api/auth.operations';
import { renderWithProviders } from '@/test/render';
import { SIDEBAR_COOKIE, SIDEBAR_OVERLAY_QUERY } from '../../sidebar.constants';
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

  it('shows a placeholder for the profile while the user is loading', () => {
    renderWithProviders(<Sidebar defaultCollapsed={false} />, { mocks: [meMock('EMPLOYEE')] });

    expect(screen.queryByRole('button', { name: /Ada Lovelace/ })).not.toBeInTheDocument();
    expect(screen.getByRole('complementary').querySelector('[aria-busy="true"]')).not.toBeNull();
  });

  it('shows the profile menu trigger once the user is loaded', async () => {
    renderWithProviders(<Sidebar defaultCollapsed={false} />, { mocks: [meMock('EMPLOYEE')] });

    expect(await screen.findByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument();
  });

  describe('on a tablet', () => {
    const useTabletWidth = () =>
      vi.mocked(window.matchMedia).mockImplementation(
        (query) =>
          ({
            matches: query === SIDEBAR_OVERLAY_QUERY,
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );

    it('starts as a closed rail even if the desktop cookie says expanded', () => {
      useTabletWidth();
      renderWithProviders(<Sidebar defaultCollapsed={false} />, { mocks: [meMock('EMPLOYEE')] });

      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute(
        'aria-expanded',
        'false',
      );
      expect(screen.getByRole('complementary')).toHaveAttribute('data-overlay-open', 'false');
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
    });

    it('opens over the page with a backdrop and does not touch the cookie', async () => {
      useTabletWidth();
      const { user } = renderWithProviders(<Sidebar defaultCollapsed />, {
        mocks: [meMock('EMPLOYEE')],
      });

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));

      expect(screen.getByRole('complementary')).toHaveAttribute('data-overlay-open', 'true');
      expect(screen.getByTestId('sidebar-backdrop')).toBeInTheDocument();
      expect(document.cookie).not.toContain(SIDEBAR_COOKIE);
    });

    it('closes on a backdrop click', async () => {
      useTabletWidth();
      const { user } = renderWithProviders(<Sidebar defaultCollapsed />, {
        mocks: [meMock('EMPLOYEE')],
      });

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      await user.click(screen.getByTestId('sidebar-backdrop'));

      expect(screen.getByRole('complementary')).toHaveAttribute('data-overlay-open', 'false');
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
    });

    it('closes on Escape and returns to the collapse toggle state', async () => {
      useTabletWidth();
      const { user } = renderWithProviders(<Sidebar defaultCollapsed />, {
        mocks: [meMock('EMPLOYEE')],
      });

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      await user.keyboard('{Escape}');

      expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveFocus();
      expect(screen.queryByTestId('sidebar-backdrop')).not.toBeInTheDocument();
    });

    it('closes after following a nav link', async () => {
      useTabletWidth();
      const { user } = renderWithProviders(<Sidebar defaultCollapsed />, {
        mocks: [meMock('EMPLOYEE')],
      });

      await user.click(screen.getByRole('button', { name: 'Expand sidebar' }));
      await user.click(screen.getByRole('link', { name: 'Skills' }));

      expect(screen.getByRole('complementary')).toHaveAttribute('data-overlay-open', 'false');
    });
  });

  it('offers a retry when the user fails to load and recovers after it', async () => {
    const { user } = renderWithProviders(<Sidebar defaultCollapsed={false} />, {
      mocks: [{ request: { query: ME }, error: new Error('Network down') }, meMock('ADMIN')],
    });

    await user.click(await screen.findByRole('button', { name: 'Profile not loaded. Retry' }));

    expect(await screen.findByRole('button', { name: /Ada Lovelace/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Departments' })).toBeInTheDocument();
  });
});
