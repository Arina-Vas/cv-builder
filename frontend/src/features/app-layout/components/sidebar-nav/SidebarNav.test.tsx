import { screen, within } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { getNavItems } from '../../navigation';
import { SidebarNav } from './SidebarNav';

describe('SidebarNav', () => {
  it('renders the common tabs without a divider for an employee', () => {
    renderWithProviders(<SidebarNav groups={getNavItems('EMPLOYEE')} />);

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Employees', 'Skills', 'Languages', 'CVs']);
    expect(within(nav).queryByRole('separator')).not.toBeInTheDocument();
  });

  it('separates the admin tabs with a divider', () => {
    renderWithProviders(<SidebarNav groups={getNavItems('ADMIN')} />);

    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const lists = within(nav).getAllByRole('list');
    expect(lists).toHaveLength(2);
    const [main, admin] = lists as [HTMLElement, HTMLElement];
    expect(within(nav).getByRole('separator')).toBeInTheDocument();
    expect(within(main).getAllByRole('link')).toHaveLength(4);
    expect(
      within(admin)
        .getAllByRole('link')
        .map((link) => link.textContent),
    ).toEqual(['Departments', 'Positions', 'Projects']);
  });

  it('marks the tab of the current page, including nested pages', () => {
    vi.mocked(usePathname).mockReturnValue('/users/42/skills');

    renderWithProviders(<SidebarNav groups={getNavItems('EMPLOYEE')} />);

    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: 'CVs' })).not.toHaveAttribute('aria-current');
  });

  it('links each tab to its page', () => {
    renderWithProviders(<SidebarNav groups={getNavItems('EMPLOYEE')} />);

    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'CVs' })).toHaveAttribute('href', '/cvs');
  });
});
