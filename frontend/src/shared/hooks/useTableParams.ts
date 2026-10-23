import type { SortState } from '../components/table/types';

export interface TableParams {
  search: string;
  sort: SortState | null;
  setSearch: (search: string) => void;
  setSort: (sort: SortState) => void;
}

export function useTableParams(): TableParams {
  return {
    search: '',
    sort: null,
    setSearch: () => {},
    setSort: () => {},
  };
}
