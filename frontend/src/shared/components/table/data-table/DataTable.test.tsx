import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { departments, type DepartmentRow } from '../__fixtures__/departments';
import type { Column, DataTableProps } from '../types';
import { DataTable } from './DataTable';

const columns: Column<DepartmentRow>[] = [
  { key: 'name', header: 'Name', render: (row) => row.name, sortable: true },
];

function renderTable(props: Partial<DataTableProps<DepartmentRow>> = {}) {
  return renderWithProviders(
    <DataTable
      columns={columns}
      rows={departments.slice(0, 3)}
      getRowId={(row) => row.id}
      getRowLabel={(row) => row.name}
      caption="Departments"
      emptyMessage="No departments found"
      {...props}
    />,
  );
}

describe('DataTable', () => {
  it('renders a row per item', () => {
    renderTable();

    const table = screen.getByRole('table', { name: 'Departments' });
    // header row + 3 data rows
    expect(within(table).getAllByRole('row')).toHaveLength(4);
    expect(screen.getByRole('cell', { name: 'React' })).toBeInTheDocument();
  });

  it('marks the table busy and hides rows while loading', () => {
    renderTable({ isLoading: true });

    expect(screen.getByRole('table')).toHaveAttribute('aria-busy', 'true');
    expect(screen.queryByRole('cell', { name: 'React' })).not.toBeInTheDocument();
  });

  it('shows the empty message when there are no rows', () => {
    renderTable({ rows: [] });

    expect(screen.getByText('No departments found')).toBeInTheDocument();
  });

  it('shows the error with a working Retry button', async () => {
    const onRetry = vi.fn();
    const { user } = renderTable({ error: 'Failed to load departments', onRetry });

    expect(screen.getByRole('alert')).toHaveTextContent('Failed to load departments');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('sorts through the header when onSortChange is given', async () => {
    const onSortChange = vi.fn();
    const { user } = renderTable({ onSortChange });

    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(onSortChange).toHaveBeenCalledWith({ field: 'name', order: 'ASC' });
  });

  it('renders a plain header when sorting is not wired', () => {
    renderTable();

    expect(screen.queryByRole('button', { name: 'Name' })).not.toBeInTheDocument();
  });

  it('opens a row through the arrow button', async () => {
    const onRowClick = vi.fn();
    const { user } = renderTable({ onRowClick });

    await user.click(screen.getByRole('button', { name: 'Open Node' }));

    expect(onRowClick).toHaveBeenCalledWith(departments[1]);
  });

  it('renders an actions menu per row', () => {
    renderTable({ rowActions: () => [{ label: 'Delete', onSelect: vi.fn() }] });

    expect(screen.getByRole('button', { name: 'Actions for React' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Actions for/ })).toHaveLength(3);
  });

  it('renders row details only when there are some', () => {
    renderTable({ renderRowDetails: (row) => (row.id === '1' ? 'Main department' : null) });

    expect(screen.getByRole('cell', { name: 'Main department' })).toBeInTheDocument();
    // header + 3 rows + 1 details row
    expect(screen.getAllByRole('row')).toHaveLength(5);
  });
});
