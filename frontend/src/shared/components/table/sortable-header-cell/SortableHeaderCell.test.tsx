import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import type { SortState } from '../types';
import { SortableHeaderCell } from './SortableHeaderCell';

function renderCell(sort?: SortState) {
  const onSortChange = vi.fn();
  const result = renderWithProviders(
    <table>
      <thead>
        <tr>
          <SortableHeaderCell field="name" header="Name" sort={sort} onSortChange={onSortChange} />
        </tr>
      </thead>
    </table>,
  );
  return { ...result, onSortChange };
}

describe('SortableHeaderCell', () => {
  it('is not sorted when another column is active', () => {
    renderCell({ field: 'email', order: 'ASC' });

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute('aria-sort', 'none');
  });

  it('starts ascending when clicked on an inactive column', async () => {
    const { user, onSortChange } = renderCell();

    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(onSortChange).toHaveBeenCalledWith({ field: 'name', order: 'ASC' });
  });

  it('switches ascending to descending', async () => {
    const { user, onSortChange } = renderCell({ field: 'name', order: 'ASC' });

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'ascending',
    );
    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(onSortChange).toHaveBeenCalledWith({ field: 'name', order: 'DESC' });
  });

  it('switches descending back to ascending', async () => {
    const { user, onSortChange } = renderCell({ field: 'name', order: 'DESC' });

    expect(screen.getByRole('columnheader', { name: 'Name' })).toHaveAttribute(
      'aria-sort',
      'descending',
    );
    await user.click(screen.getByRole('button', { name: 'Name' }));

    expect(onSortChange).toHaveBeenCalledWith({ field: 'name', order: 'ASC' });
  });
});
