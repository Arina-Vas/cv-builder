import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
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
      departmentOptions: [department, { ...department, id: 'd2', name: 'Marketing' }],
      positionOptions: [position, { ...position, id: 'p2', name: 'Designer' }],
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

  it('offers every department, not only the first page of 50', async () => {
    const many = Array.from({ length: 60 }, (_, i) => ({
      ...department,
      id: `d${i + 1}`,
      name: `Department ${String(i + 1).padStart(2, '0')}`,
    }));
    const { user } = renderWithProviders(<UserFormModal open onOpenChange={vi.fn()} />, {
      mocks: [
        {
          ...optionsMock,
          result: { data: { ...optionsMock.result.data, departmentOptions: many } },
        },
      ],
    });

    const trigger = screen.getByRole('combobox', { name: 'Department' });
    await expect.poll(() => trigger).toBeEnabled();
    await user.click(trigger);

    const options = within(document.body).getAllByRole('option');
    expect(options).toHaveLength(60);
    expect(options.at(-1)).toHaveTextContent('Department 60');
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
    expect(screen.getByLabelText('Password')).toHaveValue('********');
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password');
    expect(screen.getByLabelText('Password')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Show password' })).toBeDisabled();
    expect(screen.getByLabelText('First Name')).toHaveValue('Jane');
    expect(screen.getByLabelText('First Name')).toBeEnabled();
    expect(screen.getByLabelText('Last Name')).toBeEnabled();

    const save = screen.getByRole('button', { name: 'Update' });
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

  it('shows the spec text for a taken email under Email and stays open', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<UserFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        optionsMock,
        {
          request: {
            query: CREATE_USER,
            variables: {
              input: {
                email: 'jane@example.com',
                password: 'secret1',
                firstName: 'Jane',
                lastName: 'Doe',
                departmentId: 'd1',
                positionId: 'p1',
                role: 'EMPLOYEE',
              },
            },
          },
          result: {
            errors: [
              new GraphQLError('backend text', {
                extensions: { code: 'CONFLICT', field: 'email' },
              }),
            ],
          },
        },
      ],
    });

    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.type(screen.getByLabelText('Password'), 'secret1');
    await user.type(screen.getByLabelText('First Name'), 'Jane');
    await user.type(screen.getByLabelText('Last Name'), 'Doe');
    await choose(user, 'Department', 'Engineering');
    await choose(user, 'Position', 'Developer');
    await choose(user, 'Role', 'Employee');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const email = screen.getByLabelText('Email');
    await expect.poll(() => email).toHaveAttribute('aria-invalid', 'true');
    expect(email).toHaveAccessibleDescription('An account with this email already exists');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // OPERATION_NOT_ALLOWED has two causes; extensions.reason tells which one
  it.each([
    ['LAST_ADMIN', 'The last admin cannot be demoted. Assign the Admin role to another user first'],
    ['SELF', 'You cannot change your own role'],
    [undefined, 'This action is not allowed'],
  ])('explains reason %j for a refused role change above the buttons', async (reason, shown) => {
    const onOpenChange = vi.fn();
    const admin = { ...existing, role: 'ADMIN' as const };
    const { user } = renderWithProviders(
      <UserFormModal open onOpenChange={onOpenChange} user={admin} />,
      {
        mocks: [
          optionsMock,
          {
            request: {
              query: UPDATE_USER,
              variables: {
                input: {
                  id: 'u1',
                  firstName: 'Jane',
                  lastName: 'Doe',
                  departmentId: 'd1',
                  positionId: 'p1',
                  role: 'EMPLOYEE',
                },
              },
            },
            result: {
              errors: [
                new GraphQLError('backend text', {
                  extensions: { code: 'OPERATION_NOT_ALLOWED', reason },
                }),
              ],
            },
          },
        ],
      },
    );

    await choose(user, 'Role', 'Employee');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    const dialog = screen.getByRole('dialog', { name: 'Update user' });
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(shown);
    expect(within(dialog).queryByText('backend text')).not.toBeInTheDocument();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
