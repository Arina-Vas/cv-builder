import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_PROJECT, PROJECTS, TECHNOLOGIES } from '../api/projects.operations';
import { Projects } from './Projects';

const react = { __typename: 'Skill' as const, id: 't1', name: 'React' };
const nest = { __typename: 'Skill' as const, id: 't2', name: 'NestJS' };

const projects = [
  {
    __typename: 'Project' as const,
    id: 'p1',
    name: 'Blog',
    domain: 'Blogging',
    description: 'A blogging website',
    startDate: '2024-03-01',
    endDate: '2024-12-31',
    technologies: [react, nest],
  },
  {
    __typename: 'Project' as const,
    id: 'p2',
    name: 'CRM',
    domain: 'Sales',
    description: 'A sales system',
    startDate: '2025-01-15',
    endDate: '2025-06-30',
    technologies: [],
  },
];

const listMock = (items = projects): MockLink.MockedResponse => ({
  request: { query: PROJECTS, variables: { search: '', sortBy: 'name', sortOrder: 'ASC' } },
  result: { data: { projects: { __typename: 'ProjectList', items, total: items.length } } },
});

const technologiesMock: MockLink.MockedResponse = {
  request: { query: TECHNOLOGIES },
  result: { data: { technologies: [react, nest] } },
};

const deleteRequest = { query: DELETE_PROJECT, variables: { id: 'p1' } };

const renderPage = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(<Projects />, { mocks });

async function openRowAction(user: ReturnType<typeof renderPage>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: 'Actions for Blog' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

describe('Projects', () => {
  it('shows name, domain and dates (MM/dd/yyyy) of each project', async () => {
    renderPage();

    const row = (await screen.findByText('Blog')).closest('tr')!;
    expect(within(row).getByText('Blogging')).toBeInTheDocument();
    expect(within(row).getByText('03/01/2024')).toBeInTheDocument();
    expect(within(row).getByText('12/31/2024')).toBeInTheDocument();
  });

  it('shows the description and the technologies under the project', async () => {
    renderPage();

    const details = (await screen.findByText('A blogging website')).closest('tr')!;
    expect(
      within(details)
        .getAllByRole('listitem')
        .map((item) => item.textContent),
    ).toEqual(['React', 'NestJS']);
  });

  it('shows no technology list for a project without technologies', async () => {
    renderPage();

    const details = (await screen.findByText('A sales system')).closest('tr')!;
    expect(within(details).queryByRole('list')).not.toBeInTheDocument();
  });

  it('sorts by name and dates, not by domain', async () => {
    renderPage();
    await screen.findByText('Blog');

    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start Date' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'End Date' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Domain' })).not.toBeInTheDocument();
  });

  it('opens the create modal', async () => {
    const { user } = renderPage([listMock(), technologiesMock]);

    await user.click(screen.getByRole('button', { name: 'Create project' }));

    const dialog = screen.getByRole('dialog', { name: 'Create project' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('');
  });

  it('opens the edit modal with the row data', async () => {
    const { user } = renderPage([listMock(), technologiesMock]);

    await openRowAction(user, 'Edit');

    const dialog = screen.getByRole('dialog', { name: 'Edit project' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('Blog');
  });

  describe('delete', () => {
    it('asks to confirm with the project name in bold', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete project' });
      expect(dialog).toHaveTextContent('Are you sure you want to delete project Blog?');
      expect(within(dialog).getByText('Blog').tagName).toBe('STRONG');
    });

    it('deletes the project, closes the dialog and refreshes the list', async () => {
      const { user } = renderPage([
        listMock(),
        { request: deleteRequest, result: { data: { deleteProject: 'p1' } } },
        // refetchQueries: the list without the deleted row
        listMock(projects.slice(1)),
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('Blog')).not.toBeInTheDocument();
      expect(screen.getByText('CRM')).toBeInTheDocument();
    });

    it('shows ENTITY_IN_USE (the project is used in CVs) in the dialog and keeps it open', async () => {
      const { user } = renderPage([
        listMock(),
        {
          request: deleteRequest,
          result: {
            errors: [new GraphQLError('In use', { extensions: { code: 'ENTITY_IN_USE' } })],
          },
        },
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      const dialog = screen.getByRole('dialog', { name: 'Delete project' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "This item is in use and can't be deleted",
      );
      expect(screen.getByText('CRM')).toBeInTheDocument();
    });
  });
});
