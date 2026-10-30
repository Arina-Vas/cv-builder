import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { Pagination, type PaginationProps } from './Pagination';

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
  it('is hidden when everything fits on the smallest page', () => {
    renderPagination({ total: 10 });

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
  });

  it('marks the current page and disables Previous on the first page', () => {
    renderPagination();

    expect(screen.getByRole('button', { name: 'Page 1' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Next page' })).toBeEnabled();
  });

  it('disables Next on the last page', () => {
    renderPagination({ page: 5 });

    expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
  });

  it('changes the page with the arrows and page buttons', async () => {
    const { user, onPageChange } = renderPagination({ page: 2 });

    await user.click(screen.getByRole('button', { name: 'Next page' }));
    await user.click(screen.getByRole('button', { name: 'Previous page' }));
    await user.click(screen.getByRole('button', { name: 'Page 4' }));

    expect(onPageChange.mock.calls).toEqual([[3], [1], [4]]);
  });

  it('does not request the page that is already open', async () => {
    const { user, onPageChange } = renderPagination({ page: 2 });

    await user.click(screen.getByRole('button', { name: 'Page 2' }));

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('shows the selected page size', () => {
    renderPagination({ pageSize: 20 });

    expect(screen.getByRole('combobox', { name: 'Rows per page' })).toHaveTextContent('20');
  });
});
