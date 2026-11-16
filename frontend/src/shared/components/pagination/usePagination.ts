import { useEffect } from 'react';
import type { SetPageOptions } from '@/shared/hooks/useTableParams';
import type { PaginationProps } from './Pagination';
import { getPageCount } from './getPageItems';

type Params = {
  page: number;
  pageSize: number;
  setPage: (page: number, options?: SetPageOptions) => void;
  setPageSize: (pageSize: number) => void;
};

type Totals = {
  /** what the switcher shows: data ?? previousData, so it does not jump while loading */
  total: number | undefined;
  /** total of the response for the current variables (data only): used to clamp the page */
  freshTotal: number | undefined;
};

export const usePagination = (
  { page, pageSize, setPage, setPageSize }: Params,
  { total, freshTotal }: Totals,
): Omit<PaginationProps, 'pageSizeOptions' | 'label'> => {
  const pageCount = getPageCount(total ?? 0, pageSize);

  useEffect(() => {
    if (freshTotal === undefined) return;
    const last = getPageCount(freshTotal, pageSize);
    if (page > last) setPage(last, { replace: true });

    // setPage is a new function on every render (useTableParams); listing it would rerun the
    // effect each time. Leaving it out is safe: the page > last check stops a second redirect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, freshTotal]);

  return {
    page,
    pageSize,
    total: total ?? 0,
    onPageChange: setPage,
    onPageSizeChange: setPageSize,
    pageCount,
  };
};
