import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { SIDEBAR_COOKIE } from '../../sidebar.constants';
import { Sidebar } from './Sidebar';

describe('Sidebar', () => {
  afterEach(() => {
    document.cookie = `${SIDEBAR_COOKIE}=; path=/; max-age=0`;
  });

  it('starts expanded when the cookie says so', () => {
    renderWithProviders(<Sidebar defaultCollapsed={false} />);

    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed', 'false');
  });

  it('starts collapsed when the cookie says so', () => {
    renderWithProviders(<Sidebar defaultCollapsed />);

    const toggle = screen.getByRole('button', { name: 'Expand sidebar' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed', 'true');
  });

  it('toggles and remembers the state in a cookie', async () => {
    const { user } = renderWithProviders(<Sidebar defaultCollapsed={false} />);

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
});
