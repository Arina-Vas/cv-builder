import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DEPARTMENTS } from '../api/departments.operations';
import { Departments } from './Departments';

const departments = [
  { __typename: 'Department' as const, id: '1', name: 'Engineering' },
  { __typename: 'Department' as const, id: '2', name: 'Marketing' },
];

const listMock = {
  request: {
    query: DEPARTMENTS,
    variables: { page: 1, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' },
  },
  result: {
    data: {
      departments: {
        __typename: 'DepartmentPage',
        items: departments,
        page: 1,
        pageSize: 10,
        total: 2,
      },
    },
  },
};

const renderPage = () => renderWithProviders(<Departments />, { mocks: [listMock] });

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

  it('opens the delete confirmation for the row', async () => {
    const { user } = renderPage();

    await openRowAction(user, 'Delete');

    const dialog = screen.getByRole('dialog', { name: 'Delete department' });
    expect(dialog).toHaveTextContent('Are you sure you want to delete department Engineering?');
  });
});
