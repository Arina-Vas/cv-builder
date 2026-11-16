import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePagination } from './usePagination';

type Totals = Parameters<typeof usePagination>[1];

const setup = (page: number, totals: Totals, pageSize = 10) => {
  const setPage = vi.fn();
  const setPageSize = vi.fn();
  const hook = renderHook(
    (props: Totals) => usePagination({ page, pageSize, setPage, setPageSize }, props),
    {
      initialProps: totals,
    },
  );

  return { ...hook, setPage, setPageSize };
};

describe('usePagination', () => {
  it('returns the Pagination props with the page count of the shown total', () => {
    const { result, setPage, setPageSize } = setup(2, { total: 45, freshTotal: 45 });

    expect(result.current).toEqual({
      page: 2,
      pageSize: 10,
      total: 45,
      pageCount: 5,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    });
  });

  it('shows one empty page before the first response', () => {
    const { result, setPage } = setup(1, { total: undefined, freshTotal: undefined });

    expect(result.current).toMatchObject({ total: 0, pageCount: 1 });
    expect(setPage).not.toHaveBeenCalled();
  });

  it('leaves a page that exists alone', () => {
    const { setPage } = setup(3, { total: 23, freshTotal: 23 });

    expect(setPage).not.toHaveBeenCalled();
  });

  it('moves a page past the end to the last page, replacing the URL', () => {
    const { setPage } = setup(5, { total: 23, freshTotal: 23 });

    expect(setPage).toHaveBeenCalledExactlyOnceWith(3, { replace: true });
  });

  it('moves to page 1 when nothing is left', () => {
    const { setPage } = setup(2, { total: 0, freshTotal: 0 });

    expect(setPage).toHaveBeenCalledExactlyOnceWith(1, { replace: true });
  });

  it('waits for the response of the current page instead of trusting the previous one', () => {
    // previousData of page 1 is still shown while page 5 loads: data is undefined
    const { setPage, rerender } = setup(5, { total: 45, freshTotal: undefined });
    expect(setPage).not.toHaveBeenCalled();

    // the last row of page 5 was deleted elsewhere: the refetch shrinks the total
    rerender({ total: 40, freshTotal: 40 });
    expect(setPage).toHaveBeenCalledExactlyOnceWith(4, { replace: true });
  });
});
