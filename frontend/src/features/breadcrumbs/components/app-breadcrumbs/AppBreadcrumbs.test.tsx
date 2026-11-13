import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { BREADCRUMB_USER } from '../../api/breadcrumbs.operations';
import { AppBreadcrumbs } from './AppBreadcrumbs';

const userMock = (name: { firstName: string | null; lastName: string | null }) => ({
  request: { query: BREADCRUMB_USER, variables: { id: '42' } },
  result: {
    data: { user: { __typename: 'User', id: '42', email: 'jane@cv-builder.local', ...name } },
  },
});

describe('AppBreadcrumbs', () => {
  it('shows the section of a list page as the current page', () => {
    usePathname.mockReturnValue('/users');
    renderWithProviders(<AppBreadcrumbs />);

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByText('Employees').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('names the settings page with the profile menu label', () => {
    usePathname.mockReturnValue('/settings');
    renderWithProviders(<AppBreadcrumbs />);

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('builds section > name > tab on a detail page', () => {
    usePathname.mockReturnValue('/cvs/7/projects');
    renderWithProviders(<AppBreadcrumbs />);

    expect(screen.getByRole('link', { name: 'CVs' })).toHaveAttribute('href', '/cvs');
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Projects').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  it('updates the last item when the tab changes', () => {
    usePathname.mockReturnValue('/users/42/profile');
    const { rerender } = renderWithProviders(<AppBreadcrumbs />);
    expect(screen.getByText('Profile')).toBeInTheDocument();

    usePathname.mockReturnValue('/users/42/languages');
    rerender(<AppBreadcrumbs />);

    expect(screen.queryByText('Profile')).not.toBeInTheDocument();
    expect(screen.getByText('Languages')).toBeInTheDocument();
  });

  it('shows the employee name loaded by id', async () => {
    usePathname.mockReturnValue('/users/42/profile');
    renderWithProviders(<AppBreadcrumbs />, {
      mocks: [userMock({ firstName: 'Jane', lastName: 'Doe' })],
    });

    expect(await screen.findByRole('link', { name: 'Jane Doe' })).toHaveAttribute(
      'href',
      '/users/42/profile',
    );
  });

  it('falls back to the email when the employee has no name', async () => {
    usePathname.mockReturnValue('/users/42/skills');
    renderWithProviders(<AppBreadcrumbs />, {
      mocks: [userMock({ firstName: null, lastName: null })],
    });

    expect(await screen.findByRole('link', { name: 'jane@cv-builder.local' })).toBeInTheDocument();
  });

  it('renders nothing on a route without breadcrumbs', () => {
    usePathname.mockReturnValue('/unknown');
    renderWithProviders(<AppBreadcrumbs />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
