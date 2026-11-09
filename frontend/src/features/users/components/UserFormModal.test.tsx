import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CREATE_USER, UPDATE_USER, USER_FORM_OPTIONS } from '../api/users.operations';
import { UserFormModal } from './UserFormModal';

const department = { __typename: 'Department' as const, id: 'd1', name: 'Engineering' };
const position = { __typename: 'Position' as const, id: 'p1', name: 'Developer' };

const existing = {
  __typename: 'User' as const,
  id: 'u1',
  email: 'jane@example.com',
  firstName: 'Jane',
  lastName: 'Doe',
  avatarUrl: null,
  role: 'EMPLOYEE' as const,
  department,
  position,
};

const optionsMock = {
  request: { query: USER_FORM_OPTIONS },
  result: {
    data: {
      departments: {
        __typename: 'DepartmentPage' as const,
        items: [department, { ...department, id: 'd2', name: 'Marketing' }],
      },
      positions: {
        __typename: 'PositionPage' as const,
        items: [position, { ...position, id: 'p2', name: 'Designer' }],
      },
    },
  },
};

const choose = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  label: string,
  option: string,
) => {
  const trigger = screen.getByRole('combobox', { name: label });
  await expect.poll(() => trigger).toBeEnabled();
  await user.click(trigger);
  await user.click(within(document.body).getByRole('option', { name: option }));
};

describe('UserFormModal', () => {
  it('creates a user with every field and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<UserFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        optionsMock,
        {
          request: {
            query: CREATE_USER,
            variables: {
              input: {
                email: 'john@example.com',
                password: 'secret1',
                firstName: 'John',
                lastName: 'Smith',
                departmentId: 'd2',
                positionId: 'p2',
                role: 'ADMIN',
              },
            },
          },
          result: {
            data: {
              createUser: { ...existing, id: 'u2', email: 'john@example.com', role: 'ADMIN' },
            },
          },
        },
      ],
    });

    expect(screen.getByRole('dialog', { name: 'Create user' })).toBeInTheDocument();
    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toBeDisabled();

    await user.type(screen.getByLabelText('Email'), ' john@example.com ');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.type(screen.getByLabelText('First Name'), 'John');
    await user.type(screen.getByLabelText('Last Name'), 'Smith');
    await choose(user, 'Department', 'Marketing');
    await choose(user, 'Position', 'Designer');
    await choose(user, 'Role', 'Admin');

    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    await user.click(create);

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the spec message after leaving an empty field', async () => {
    const { user } = renderWithProviders(<UserFormModal open onOpenChange={vi.fn()} />, {
      mocks: [optionsMock],
    });

    await user.click(screen.getByLabelText('Email'));
    await user.tab();

    expect(await screen.findByText('Email is required')).toBeInTheDocument();
  });

  it('updates names, department, position and role; email and password are disabled', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <UserFormModal open onOpenChange={onOpenChange} user={existing} />,
      {
        mocks: [
          optionsMock,
          {
            request: {
              query: UPDATE_USER,
              variables: {
                input: {
                  id: 'u1',
                  firstName: 'Janet',
                  lastName: 'Doe',
                  departmentId: 'd1',
                  positionId: 'p2',
                  role: 'EMPLOYEE',
                },
              },
            },
            result: { data: { updateUser: { ...existing, position: { ...position, id: 'p2' } } } },
          },
        ],
      },
    );

    expect(screen.getByRole('dialog', { name: 'Update user' })).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveValue('jane@example.com');
    expect(screen.getByLabelText('Email')).toBeDisabled();
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByLabelText('First Name')).toHaveValue('Jane');
    expect(screen.getByLabelText('First Name')).toBeEnabled();
    expect(screen.getByLabelText('Last Name')).toBeEnabled();

    const save = screen.getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText('First Name'), 't ');
    await choose(user, 'Position', 'Designer');
    await user.click(save);

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it("doesn't let an admin change their own role", () => {
    renderWithProviders(<UserFormModal open onOpenChange={vi.fn()} user={existing} isSelf />, {
      mocks: [optionsMock],
    });

    expect(screen.getByRole('combobox', { name: 'Role' })).toBeDisabled();
  });
});
