import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_DEPARTMENT } from '../api/departments.operations';
import { DeleteDepartmentDialog } from './DeleteDepartmentDialog';

const department = { __typename: 'Department' as const, id: '1', name: 'Engineering' };
const request = { query: DELETE_DEPARTMENT, variables: { id: department.id } };

const deleted: MockLink.MockedResponse = {
  request,
  result: { data: { deleteDepartment: department.id } },
};

function renderDialog(mocks: MockLink.MockedResponse[] = [deleted]) {
  const onClose = vi.fn();
  const onDeleted = vi.fn();
  const result = renderWithProviders(
    <DeleteDepartmentDialog department={department} onClose={onClose} onDeleted={onDeleted} />,
    { mocks },
  );
  return { ...result, onClose, onDeleted };
}

describe('DeleteDepartmentDialog', () => {
  it('asks to confirm with the department name in bold', () => {
    renderDialog();

    expect(screen.getByRole('dialog', { name: 'Delete department' })).toBeInTheDocument();
    expect(screen.getByText('Engineering').tagName).toBe('STRONG');
  });

  it('deletes the department and closes', async () => {
    const { user, onClose, onDeleted } = renderDialog();

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    await expect.poll(() => onClose).toHaveBeenCalled();
    expect(onDeleted).toHaveBeenCalled();
  });

  it('shows ENTITY_IN_USE in the dialog and stays open', async () => {
    const { user, onClose, onDeleted } = renderDialog([
      {
        request,
        result: {
          errors: [new GraphQLError('In use', { extensions: { code: 'ENTITY_IN_USE' } })],
        },
      },
    ]);

    await user.click(screen.getByRole('button', { name: 'Confirm' }));

    expect(await screen.findByText("This item is in use and can't be deleted")).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
    expect(onDeleted).not.toHaveBeenCalled();
  });
});
