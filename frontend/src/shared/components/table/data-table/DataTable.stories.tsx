import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useState } from 'react';
import { fn } from 'storybook/test';

import { positions, type PositionRow } from '../__fixtures__/positions';
import { users, type UserRow } from '../__fixtures__/users';
import type { Column, SortState } from '../types';
import { DataTable } from './DataTable';

const meta = {
  title: 'Shared/DataTable',
  component: DataTable<PositionRow>,
  args: {
    columns: [{ key: 'name', header: 'Name', render: (row) => row.name }],
    rows: positions,
    getRowId: (row) => row.id,
    caption: 'Positions',
    emptyMessage: 'No positions found',
  },
} satisfies Meta<typeof DataTable<PositionRow>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/* ------------------------------------------------------------------ */
/* States                                                              */
/* ------------------------------------------------------------------ */

export const Loading: Story = {
  args: { isLoading: true },
};

export const Empty: Story = {
  args: { rows: [] },
};

export const ErrorState: Story = {
  name: 'Error',
  args: {
    error: 'Failed to load positions',
    onRetry: fn(),
  },
};

/* ------------------------------------------------------------------ */
/* Users: sorting                                                      */
/* ------------------------------------------------------------------ */

type UserSortField = Exclude<keyof UserRow, 'id'>;

const userColumns: Column<UserRow>[] = [
  // Placeholder until the Avatar component exists
  { key: 'avatar', header: '', width: '56px', render: (user) => <span>{user.firstName[0]}</span> },
  { key: 'firstName', header: 'First Name', sortable: true, render: (user) => user.firstName },
  { key: 'lastName', header: 'Last Name', sortable: true, render: (user) => user.lastName },
  { key: 'email', header: 'Email', render: (user) => user.email },
  { key: 'department', header: 'Department', sortable: true, render: (user) => user.department },
  { key: 'position', header: 'Position', sortable: true, render: (user) => user.position },
];

// Stands in for backend sorting
function sortUsers(rows: UserRow[], sort?: SortState) {
  if (!sort) return rows;

  const field = sort.field as UserSortField;
  const direction = sort.order === 'ASC' ? 1 : -1;

  return [...rows].sort((a, b) => a[field].localeCompare(b[field]) * direction);
}

function UsersTable() {
  const [sort, setSort] = useState<SortState>({ field: 'department', order: 'ASC' });

  return (
    <DataTable
      columns={userColumns}
      rows={sortUsers(users, sort)}
      getRowId={(user) => user.id}
      caption="Employees"
      emptyMessage="No users found"
      sort={sort}
      onSortChange={setSort}
    />
  );
}

export const Users: Story = {
  render: () => <UsersTable />,
};
