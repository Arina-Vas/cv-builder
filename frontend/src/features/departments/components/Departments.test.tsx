import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_DEPARTMENT, DEPARTMENTS } from '../api/departments.operations';
import { Departments } from './Departments';

const departments = [
  { __typename: 'Department' as const, id: '1', name: 'Engineering' },
  { __typename: 'Department' as const, id: '2', name: 'Marketing' },
];

const listMock = (items = departments): MockLink.MockedResponse => ({
  request: {
    query: DEPARTMENTS,
    variables: { page: 1, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' },
  },
  result: {
    data: {
      departments: {
        __typename: 'DepartmentPage',
        items,
        page: 1,
        pageSize: 10,
        total: items.length,
      },
    },
  },
});

const deleteRequest = { query: DELETE_DEPARTMENT, variables: { id: '1' } };

const renderPage = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(<Departments />, { mocks });

async function openRowAction(user: ReturnType<typeof renderPage>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: 'Actions for Engineering' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

describe('Departments', () => {
  it('shows the departments from the API', async () => {
    renderPage();

    expect(await screen.findByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Marketing')).toBeInTheDocument();
  });

  it('opens the create modal', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Create department' }));

    const dialog = screen.getByRole('dialog', { name: 'Create department' });
    expect(within(dialog).getByLabelText('Department')).toHaveValue('');
  });

  it('opens the edit modal with the row data', async () => {
    const { user } = renderPage();

    await openRowAction(user, 'Edit');

    const dialog = screen.getByRole('dialog', { name: 'Edit department' });
    expect(within(dialog).getByLabelText('Department')).toHaveValue('Engineering');
  });

  describe('delete', () => {
    it('asks to confirm with the department name in bold', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete department' });
      expect(dialog).toHaveTextContent('Are you sure you want to delete department Engineering?');
      expect(within(dialog).getByText('Engineering').tagName).toBe('STRONG');
    });

    it('deletes the department, closes the dialog and refreshes the list', async () => {
      const { user } = renderPage([
        listMock(),
        { request: deleteRequest, result: { data: { deleteDepartment: '1' } } },
        // refetchQueries: the list without the deleted row
        listMock(departments.slice(1)),
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('Engineering')).not.toBeInTheDocument();
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });

    it('shows ENTITY_IN_USE in the dialog and keeps it open', async () => {
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

      const dialog = screen.getByRole('dialog', { name: 'Delete department' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "This item is in use and can't be deleted",
      );
      expect(screen.getByText('Marketing')).toBeInTheDocument();
    });
  });
});
