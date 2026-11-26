import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { useSearchParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { mockRouter } from '@/test/next-navigation';
import { ME } from '@/features/auth/api/auth.operations';
import { DELETE_USER, UPDATE_USER, USER_FORM_OPTIONS, USERS } from '../api/users.operations';
import { Users } from './Users';

const department = { __typename: 'Department' as const, id: 'd1', name: 'Engineering' };
const position = { __typename: 'Position' as const, id: 'p1', name: 'Developer' };

const makeUser = (id: string, firstName: string, lastName: string, role = 'EMPLOYEE' as const) => ({
  __typename: 'User' as const,
  id,
  email: `${firstName.toLowerCase()}@example.com`,
  firstName,
  lastName,
  avatarUrl: null,
  role,
  department,
  position,
});

const jane = makeUser('u1', 'Jane', 'Doe');
const john = makeUser('u2', 'John', 'Smith');
const admin = { ...makeUser('a1', 'Ada', 'Admin'), role: 'ADMIN' as const };

const meMock = (me: typeof jane | typeof admin): MockLink.MockedResponse => ({
  request: { query: ME },
  result: {
    data: {
      me: {
        __typename: 'User',
        id: me.id,
        email: me.email,
        role: me.role,
        emailVerifiedAt: null,
        firstName: me.firstName,
        lastName: me.lastName,
        avatarUrl: null,
      },
    },
  },
});

const listRequest = {
  query: USERS,
  variables: { page: 1, pageSize: 10, search: '', sortBy: 'createdAt', sortOrder: 'DESC' },
};

const listMock = (items = [admin, jane, john]): MockLink.MockedResponse => ({
  request: listRequest,
  result: {
    data: {
      users: { __typename: 'UserPage', items, page: 1, pageSize: 10, total: items.length },
    },
  },
});

const optionsMock: MockLink.MockedResponse = {
  request: { query: USER_FORM_OPTIONS },
  result: {
    data: {
      departmentOptions: [department],
      positionOptions: [position],
    },
  },
};

const notFoundError = new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } });

const renderPage = (mocks: MockLink.MockedResponse[]) => renderWithProviders(<Users />, { mocks });

async function openRowAction(
  user: ReturnType<typeof renderPage>['user'],
  row: string,
  action: string,
) {
  await user.click(await screen.findByRole('button', { name: `Actions for ${row}` }));
  await user.click(screen.getByRole('menuitem', { name: action }));
}

describe('Users', () => {
  it('shows the users with a screen-reader-only avatar header', async () => {
    renderPage([meMock(admin), listMock()]);

    expect(await screen.findByText('jane@example.com')).toBeInTheDocument();
    expect(screen.getByText('Smith')).toBeInTheDocument();
    expect(screen.getAllByText('Engineering').length).toBeGreaterThan(0);
    expect(screen.getByRole('columnheader', { name: 'Avatar' })).toBeInTheDocument();
  });

  it('shows the empty message', async () => {
    renderPage([meMock(admin), listMock([])]);

    expect(await screen.findByText('No users found')).toBeInTheDocument();
  });

  it('shows the error with Retry that repeats the request', async () => {
    const { user } = renderPage([
      meMock(admin),
      { request: listRequest, error: new Error('Network down') },
      listMock(),
    ]);

    await user.click(await screen.findByRole('button', { name: 'Retry' }));

    expect(await screen.findByText('jane@example.com')).toBeInTheDocument();
  });

  describe('page past the end', () => {
    // the URL says ?page=2; the setup file resets the mock after each test
    const openPage2 = () =>
      vi
        .mocked(useSearchParams)
        .mockReturnValue(new URLSearchParams('page=2') as ReturnType<typeof useSearchParams>);

    const page2Request = { ...listRequest, variables: { ...listRequest.variables, page: 2 } };

    const page2Mock = (items: (typeof jane)[], total: number): MockLink.MockedResponse => ({
      request: page2Request,
      result: { data: { users: { __typename: 'UserPage', items, page: 2, pageSize: 10, total } } },
    });

    it('goes to the last page instead of showing an empty table', async () => {
      openPage2();
      renderPage([meMock(admin), page2Mock([], 3)]);

      await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/', { scroll: false }));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('goes back a page after deleting its last user', async () => {
      openPage2();
      const { user } = renderPage([
        meMock(admin),
        page2Mock([jane], 11),
        {
          request: { query: DELETE_USER, variables: { id: 'u1' } },
          result: { data: { deleteUser: 'u1' } },
        },
        // refetchQueries: page 2 is empty now
        page2Mock([], 10),
      ]);

      await openRowAction(user, 'Jane Doe', 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(mockRouter.replace).toHaveBeenCalledWith('/', { scroll: false }));
      expect(mockRouter.push).not.toHaveBeenCalled();
    });
  });

  describe('employee', () => {
    it('has no create button and no row menu, a row opens the user', async () => {
      const { user } = renderPage([meMock(jane), listMock()]);

      await user.click(await screen.findByRole('button', { name: 'Open John Smith' }));

      expect(mockRouter.push).toHaveBeenCalledWith('/users/u2');
      expect(screen.queryByRole('button', { name: 'Create user' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^Actions for/ })).not.toBeInTheDocument();
    });
  });

  describe('admin', () => {
    it('opens the create modal', async () => {
      const { user } = renderPage([meMock(admin), listMock()]);

      await user.click(await screen.findByRole('button', { name: 'Create user' }));

      expect(screen.getByRole('dialog', { name: 'Create user' })).toBeInTheDocument();
    });

    it('views and updates a user from the row menu', async () => {
      const { user } = renderPage([meMock(admin), listMock()]);

      await openRowAction(user, 'Jane Doe', 'View');
      expect(mockRouter.push).toHaveBeenCalledWith('/users/u1');

      await openRowAction(user, 'Jane Doe', 'Update');
      const dialog = screen.getByRole('dialog', { name: 'Update user' });
      expect(within(dialog).getByLabelText('First Name')).toHaveValue('Jane');
    });

    it("doesn't offer to delete their own account", async () => {
      const { user } = renderPage([meMock(admin), listMock()]);

      await user.click(await screen.findByRole('button', { name: 'Actions for Ada Admin' }));

      expect(screen.getByRole('menuitem', { name: 'Update' })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Delete' })).not.toBeInTheDocument();
    });

    it('asks to confirm with the full name in bold', async () => {
      const { user } = renderPage([meMock(admin), listMock()]);

      await openRowAction(user, 'Jane Doe', 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete user' });
      expect(dialog).toHaveTextContent('Are you sure you want to delete user Jane Doe?');
      expect(within(dialog).getByText('Jane Doe').tagName).toBe('STRONG');
    });

    it('deletes the user, closes the dialog and refreshes the list', async () => {
      const { user } = renderPage([
        meMock(admin),
        listMock(),
        {
          request: { query: DELETE_USER, variables: { id: 'u1' } },
          result: { data: { deleteUser: 'u1' } },
        },
        // refetchQueries: the list without the deleted row
        listMock([admin, john]),
      ]);

      await openRowAction(user, 'Jane Doe', 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    // OPERATION_NOT_ALLOWED has two causes; extensions.reason tells which one
    it.each([
      [
        'LAST_ADMIN',
        'The last admin cannot be deleted. Assign the Admin role to another user first',
      ],
      ['SELF', 'You cannot delete your own account'],
      [undefined, 'This action is not allowed'],
    ])(
      'shows a delete rejected with reason %j in the dialog and keeps it open',
      async (reason, shown) => {
        const { user } = renderPage([
          meMock(admin),
          listMock(),
          {
            request: { query: DELETE_USER, variables: { id: 'u1' } },
            result: {
              errors: [
                new GraphQLError('backend text', {
                  extensions: { code: 'OPERATION_NOT_ALLOWED', reason },
                }),
              ],
            },
          },
        ]);

        await openRowAction(user, 'Jane Doe', 'Delete');
        await user.click(screen.getByRole('button', { name: 'Confirm' }));

        const dialog = screen.getByRole('dialog', { name: 'Delete user' });
        expect(await within(dialog).findByRole('alert')).toHaveTextContent(shown);
        expect(within(dialog).queryByText('backend text')).not.toBeInTheDocument();
        expect(screen.getByText('jane@example.com')).toBeInTheDocument();
      },
    );

    it('removes the row when the user to delete is already gone (NOT_FOUND)', async () => {
      const { user } = renderPage([
        meMock(admin),
        listMock(),
        {
          request: { query: DELETE_USER, variables: { id: 'u1' } },
          result: { errors: [notFoundError] },
        },
        // useRefetchOnError: the list without the missing user
        listMock([admin, john]),
      ]);

      await openRowAction(user, 'Jane Doe', 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      const dialog = screen.getByRole('dialog', { name: 'Delete user' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'This item no longer exists',
      );
      await waitFor(() => expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument());
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('removes the row when the user to update is already gone (NOT_FOUND)', async () => {
      const { user } = renderPage([
        meMock(admin),
        listMock(),
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
                positionId: 'p1',
                role: 'EMPLOYEE',
              },
            },
          },
          result: { errors: [notFoundError] },
        },
        // useRefetchOnError: the list without the missing user
        listMock([admin, john]),
      ]);

      await openRowAction(user, 'Jane Doe', 'Update');
      const dialog = screen.getByRole('dialog', { name: 'Update user' });
      await user.type(within(dialog).getByLabelText('First Name'), 't');
      await user.click(within(dialog).getByRole('button', { name: 'Update' }));

      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'This item no longer exists',
      );
      // the email in the dialog is an input value, so this only finds the table cell
      await waitFor(() => expect(screen.queryByText('jane@example.com')).not.toBeInTheDocument());
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });
  });
});
