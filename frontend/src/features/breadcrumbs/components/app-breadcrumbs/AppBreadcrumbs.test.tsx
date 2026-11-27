import { screen, waitFor } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { BREADCRUMB_CV, BREADCRUMB_USER } from '../../api/breadcrumbs.operations';
import { AppBreadcrumbs } from './AppBreadcrumbs';

const userMock = (name: { firstName: string | null; lastName: string | null }) => ({
  request: { query: BREADCRUMB_USER, variables: { id: '42' } },
  result: {
    data: { user: { __typename: 'User', id: '42', email: 'jane@cv-builder.local', ...name } },
  },
});

const cvRequest = { query: BREADCRUMB_CV, variables: { id: '7' } };

const cvMock = (name = 'Frontend Developer') => ({
  request: cvRequest,
  result: { data: { cv: { __typename: 'Cv', id: '7', name } } },
});

const cvErrorMock = (code: string) => ({
  request: cvRequest,
  result: { errors: [new GraphQLError('backend text', { extensions: { code } })] },
});

// the CV crumb links to the first CV tab
const cvCrumb = (container: HTMLElement) => container.querySelector('a[href="/cvs/7/details"]');

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
    renderWithProviders(<AppBreadcrumbs />, { mocks: [cvMock()] });

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

  describe('CV pages', () => {
    it('shows a placeholder instead of the CV name while it loads', () => {
      usePathname.mockReturnValue('/cvs/7/details');
      const { container } = renderWithProviders(<AppBreadcrumbs />, { mocks: [cvMock()] });

      expect(screen.getAllByRole('listitem')).toHaveLength(3);
      expect(cvCrumb(container)).not.toBeInTheDocument();
    });

    it('shows the CV name loaded by id, linked to the Details tab', async () => {
      usePathname.mockReturnValue('/cvs/7/skills');
      renderWithProviders(<AppBreadcrumbs />, { mocks: [cvMock()] });

      expect(await screen.findByRole('link', { name: 'Frontend Developer' })).toHaveAttribute(
        'href',
        '/cvs/7/details',
      );
      expect(screen.getByText('Skills').closest('[aria-current]')).toHaveAttribute(
        'aria-current',
        'page',
      );
    });

    // wiki CV Details: the breadcrumb must not expose a CV the user may not access.
    // The page shows CV not found / Access denied, so only the section is left: no empty name, no tab
    it.each(['FORBIDDEN', 'NOT_FOUND'])(
      'leaves only CVs and shows no CV data on %s',
      async (code) => {
        usePathname.mockReturnValue('/cvs/7/details');
        renderWithProviders(<AppBreadcrumbs />, { mocks: [cvErrorMock(code)] });

        await waitFor(() => expect(screen.getAllByRole('listitem')).toHaveLength(1));
        expect(screen.getByText('CVs')).toBeInTheDocument();
        expect(screen.queryByText('Details')).not.toBeInTheDocument();
        expect(screen.queryByText('backend text')).not.toBeInTheDocument();
      },
    );
  });

  it('renders nothing on a route without breadcrumbs', () => {
    usePathname.mockReturnValue('/unknown');
    renderWithProviders(<AppBreadcrumbs />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });
});
