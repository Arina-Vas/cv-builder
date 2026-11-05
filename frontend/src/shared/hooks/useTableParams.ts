'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import type { SortOrder, SortState } from '../components/table/types';
import { DEFAULT_PAGE_SIZE_OPTIONS } from '../components/pagination';

export interface TableSort<TSortField extends string> {
  field: TSortField;
  order: SortOrder;
}

export interface TableParamsOptions<TSortField extends string> {
  sortFields: readonly TSortField[];
  defaultSort: TableSort<TSortField>;
  defaultPageSize?: number;
}

export interface TableParams<TSortField extends string> {
  search: string;
  sort: TableSort<TSortField>;
  page: number;
  pageSize: number;

  setSearch: (search: string) => void;
  setSort: (sort: SortState) => void;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
}

export function useTableParams<TSortField extends string>(
  options: TableParamsOptions<TSortField>,
): TableParams<TSortField> {
  const params = useSearchParams();
  const router = useRouter();
  const currentPath = usePathname();
  const search = params.get('search') ?? '';
  const sortBy = params.get('sortBy');
  const sortOrder = params.get('sortOrder');
  const page = params.get('page');
  const pageSize = params.get('pageSize');

  const sort: TableSort<TSortField> = isSortField(sortBy, options.sortFields)
    ? { field: sortBy, order: parseSortOrder(sortOrder, options.defaultSort.order) }
    : options.defaultSort;

  const updateParams = (
    updates: Record<string, string | number | null>,
    method: 'push' | 'replace' = 'push',
  ) => {
    const nextParams = new URLSearchParams(params.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value.toString());
      }
    }

    const query = nextParams.toString();
    const finalUrl = query ? `${currentPath}?${query}` : currentPath;

    router[method](finalUrl, { scroll: false });
  };

  return {
    search,
    sort,
    page: parsePage(page),
    pageSize: parsePageSize(pageSize, options.defaultPageSize ?? 10),
    setSearch: (nextSearch) => updateParams({ search: nextSearch, page: null }, 'replace'),
    setSort: (nextSort) =>
      updateParams({ sortBy: nextSort.field, sortOrder: nextSort.order, page: null }),
    setPage: (nextPage) => updateParams({ page: nextPage === 1 ? null : nextPage }),
    setPageSize: (nextPageSize) => updateParams({ pageSize: nextPageSize, page: null }),
  };
}

const parsePage = (val: string | null): number => {
  const page = Number(val);

  return Number.isInteger(page) && page >= 1 ? page : 1;
};

const parsePageSize = (val: string | null, fallback: number): number => {
  const pageSize = Number(val);

  return DEFAULT_PAGE_SIZE_OPTIONS.includes(pageSize) ? pageSize : fallback;
};

const parseSortOrder = (val: string | null, fallback: SortOrder): SortOrder => {
  return val === 'ASC' || val === 'DESC' ? val : fallback;
};

const isSortField = <TSortField extends string>(
  val: string | null,
  list: readonly TSortField[],
): val is TSortField => {
  return val !== null && (list as readonly string[]).includes(val);
};
