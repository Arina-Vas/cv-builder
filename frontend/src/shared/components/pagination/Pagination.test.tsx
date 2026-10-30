import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Pagination, type PaginationProps } from './Pagination';

// Hidden on one page, Next disabled on the last page and moving forward are covered by
// Pagination.stories.tsx (OnePage, LastPage, Interactive); only the rest is tested here.

function renderPagination(props: Partial<PaginationProps> = {}) {
  const onPageChange = vi.fn();
  const onPageSizeChange = vi.fn();
  const result = renderWithProviders(
    <Pagination
      page={1}
      pageSize={10}
      total={45}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      {...props}
    />,
  );
  return { ...result, onPageChange, onPageSizeChange };
}

describe('Pagination', () => {
  it('goes back one page with Previous', async () => {
    const { user, onPageChange } = renderPagination({ page: 3 });

    await user.click(screen.getByRole('button', { name: 'Previous page' }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('does not request the page that is already open', async () => {
    const { user, onPageChange } = renderPagination({ page: 2 });

    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('stays visible with one page when a bigger page size is selected, so it can be reduced', () => {
    renderPagination({ total: 30, pageSize: 50 });

    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('shows the selected page size', () => {
    renderPagination({ pageSize: 20 });

    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveTextContent('20');
  });
});
