import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('renders the page inside the main area next to the sidebar', () => {
    renderWithProviders(
      <AppShell defaultCollapsed={false}>
        <h1>Users</h1>
      </AppShell>,
    );

    const main = screen.getByRole('main');
    expect(within(main).getByRole('heading', { name: 'Users' })).toBeInTheDocument();
    expect(screen.getByRole('complementary')).toHaveAttribute('data-collapsed', 'false');
  });
});
