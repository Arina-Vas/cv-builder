import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound, useSearchParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { CatchErrors } from '@/test/catch-errors';
import { renderWithProviders } from '@/test/render';
import {
  AVAILABLE_CV_PROJECTS,
  CV_PROJECTS,
  DELETE_CV_PROJECT,
  PROJECT_ROLES,
} from '../api/cvProjects.operations';
import { CvProjects } from './CvProjects';

const CV_ID = 'cv1';

const react = { __typename: 'Skill' as const, id: 't1', name: 'React' };
const developer = { __typename: 'ProjectRole' as const, id: 'r1', name: 'Developer' };

const catalogProject = (
  id: string,
  name: string,
  domain: string,
  description: string,
  endDate = '2025-12-31',
) => ({
  __typename: 'Project' as const,
  id,
  name,
  domain,
  description,
  startDate: '2024-01-01',
  endDate,
  technologies: [react],
});

const blog = {
  __typename: 'CvProject' as const,
  id: 'cp1',
  startDate: '2024-03-01',
  endDate: '2024-12-31',
  responsibilities: 'Code review, Mentoring',
  roles: [developer],
  project: catalogProject('p1', 'Blog', 'Blogging', 'A blogging website'),
};

const crm = {
  __typename: 'CvProject' as const,
  id: 'cp2',
  startDate: '2025-01-15',
  endDate: null,
  responsibilities: null,
  roles: [developer],
  // still running, so an empty CV end date means "Till now"
  project: catalogProject('p2', 'CRM', 'Sales', 'A sales system', '2099-12-31'),
};

const archive = {
  __typename: 'CvProject' as const,
  id: 'cp3',
  startDate: '2024-02-01',
  endDate: null,
  responsibilities: null,
  roles: [developer],
  // ended 2025-12-31
  project: catalogProject('p3', 'Archive', 'Legacy', 'A legacy system'),
};

const variables = (search = '') => ({ cvId: CV_ID, search, sortBy: 'name', sortOrder: 'ASC' });

const listMock = (items = [blog, crm], search = ''): MockLink.MockedResponse => ({
  request: { query: CV_PROJECTS, variables: variables(search) },
  result: {
    data: { cvProjects: { __typename: 'CvProjectList' as const, items, total: items.length } },
  },
});

const errorMock = (code: string): MockLink.MockedResponse => ({
  request: { query: CV_PROJECTS, variables: variables() },
  result: { errors: [new GraphQLError('backend text', { extensions: { code } })] },
});

const formMocks: MockLink.MockedResponse[] = [
  {
    request: { query: AVAILABLE_CV_PROJECTS, variables: { cvId: CV_ID } },
    result: { data: { availableCvProjects: [] } },
  },
  { request: { query: PROJECT_ROLES }, result: { data: { projectRoles: [developer] } } },
];

const deleteRequest = { query: DELETE_CV_PROJECT, variables: { id: 'cp1', cvId: CV_ID } };

const renderPage = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(
    <CatchErrors>
      <CvProjects cvId={CV_ID} />
    </CatchErrors>,
    { mocks },
  );

async function openRowAction(user: ReturnType<typeof renderPage>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: 'Actions for Blog' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

describe('CvProjects', () => {
  it('shows name, domain and the CV-specific dates (MM/dd/yyyy) of each project', async () => {
    renderPage();

    const row = (await screen.findByText('Blog')).closest('tr')!;
    expect(within(row).getByText('Blogging')).toBeInTheDocument();
    expect(within(row).getByText('03/01/2024')).toBeInTheDocument();
    expect(within(row).getByText('12/31/2024')).toBeInTheDocument();
  });

  it('shows a running project without an end date as ongoing', async () => {
    renderPage();

    const row = (await screen.findByText('CRM')).closest('tr')!;
    expect(within(row).getByText('Till now')).toBeInTheDocument();
  });

  it('shows the project end date for a finished project without a CV end date', async () => {
    renderPage([listMock([archive])]);

    const row = (await screen.findByText('Archive')).closest('tr')!;
    expect(within(row).getByText('12/31/2025')).toBeInTheDocument();
    expect(within(row).queryByText('Till now')).not.toBeInTheDocument();
  });

  it('shows the description and the responsibilities as chips under the project', async () => {
    renderPage();

    const details = (await screen.findByText('A blogging website')).closest('tr')!;
    expect(
      within(details)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['Code review', 'Mentoring']);
  });

  it('sorts by name and dates, not by domain', async () => {
    renderPage();
    await screen.findByText('Blog');

    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Date' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Date' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Domain' })).not.toBeInTheDocument();
  });

  describe('states', () => {
    it('tells that the CV has no projects yet', async () => {
      renderPage([listMock([])]);

      expect(await screen.findByText('No projects added yet')).toBeInTheDocument();
      // adding is still possible from the empty state
      expect(screen.getByRole('button', { name: 'Add project' })).toBeInTheDocument();
    });

    it('tells that nothing matches the search, and sends the search to the backend', async () => {
      vi.mocked(useSearchParams).mockReturnValue(
        new URLSearchParams('search=xyz') as ReturnType<typeof useSearchParams>,
      );
      renderPage([listMock([], 'xyz')]);

      expect(await screen.findByText('No projects found')).toBeInTheDocument();
    });

    it('shows the error with Retry that repeats the request', async () => {
      const { user } = renderPage([
        { request: { query: CV_PROJECTS, variables: variables() }, error: new Error('Network') },
        listMock(),
      ]);

      expect(await screen.findByText('Failed to load projects')).toBeInTheDocument();
      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('Blog')).toBeInTheDocument();
    });

    it('shows FORBIDDEN as "not authorized", without Retry', async () => {
      renderPage([errorMock('FORBIDDEN')]);

      expect(
        await screen.findByText('You are not authorized to access this CV'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
    });

    it('opens the 404 page when the CV does not exist', async () => {
      // React logs the error caught by the boundary; keep the test output clean
      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderPage([errorMock('NOT_FOUND')]);

      await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
    });
  });

  it('opens the empty Add project modal', async () => {
    const { user } = renderPage([listMock(), ...formMocks]);

    await user.click(await screen.findByRole('button', { name: 'Add project' }));

    const dialog = screen.getByRole('dialog', { name: 'Add project' });
    expect(within(dialog).getByLabelText('Domain')).toHaveValue('');
  });

  it('opens Update project with the row data', async () => {
    const { user } = renderPage([listMock(), ...formMocks]);

    await openRowAction(user, 'Update');

    const dialog = screen.getByRole('dialog', { name: 'Update project' });
    expect(within(dialog).getByLabelText('Domain')).toHaveValue('Blogging');
    expect(within(dialog).getByLabelText('Start Date')).toHaveTextContent('03/01/2024');
  });

  describe('remove', () => {
    it('asks to confirm with the project name in bold', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Remove project' });
      expect(dialog).toHaveTextContent('Are you sure you want to remove project Blog?');
      expect(within(dialog).getByText('Blog').tagName).toBe('STRONG');
    });

    it('cancel closes the dialog without a request', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByText('Blog')).toBeInTheDocument();
    });

    it('removes the project from this CV and refreshes the list', async () => {
      const { user } = renderPage([
        listMock(),
        { request: deleteRequest, result: { data: { deleteCvProject: 'cp1' } } },
        // refetchQueries: the list without the removed row
        listMock([crm]),
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('Blog')).not.toBeInTheDocument();
      expect(screen.getByText('CRM')).toBeInTheDocument();
    });

    it('keeps the dialog open with the error when removing fails', async () => {
      const { user } = renderPage([
        listMock(),
        {
          request: deleteRequest,
          result: {
            errors: [new GraphQLError('backend text', { extensions: { code: 'INTERNAL' } })],
          },
        },
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      const dialog = screen.getByRole('dialog', { name: 'Remove project' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Something went wrong. Please try again later',
      );
      // the row stays ("Blog" itself is also in the dialog message)
      expect(screen.getByText('Blogging')).toBeInTheDocument();
    });
  });
});
