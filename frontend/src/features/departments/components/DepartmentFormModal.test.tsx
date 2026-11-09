import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CREATE_DEPARTMENT, UPDATE_DEPARTMENT } from '../api/departments.operations';
import { DepartmentFormModal } from './DepartmentFormModal';

const department = { __typename: 'Department' as const, id: '1', name: 'Engineering' };

describe('DepartmentFormModal', () => {
  it('creates a department and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<DepartmentFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        {
          request: { query: CREATE_DEPARTMENT, variables: { input: { name: 'Marketing' } } },
          result: { data: { createDepartment: { ...department, id: '2', name: 'Marketing' } } },
        },
      ],
    });

    expect(screen.getByRole('dialog', { name: 'Create department' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Department'), '  Marketing ');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('edits the department: prefilled, saves only after a change', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <DepartmentFormModal open onOpenChange={onOpenChange} department={department} />,
      {
        mocks: [
          {
            request: {
              query: UPDATE_DEPARTMENT,
              variables: { input: { id: '1', name: 'Research' } },
            },
            result: { data: { updateDepartment: { ...department, name: 'Research' } } },
          },
        ],
      },
    );

    const input = screen.getByLabelText('Department');
    expect(screen.getByRole('dialog', { name: 'Edit department' })).toBeInTheDocument();
    expect(input).toHaveValue('Engineering');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.clear(input);
    await user.type(input, 'Research');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });
});
