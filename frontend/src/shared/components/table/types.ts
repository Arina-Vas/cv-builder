import type { ReactNode } from 'react';

export type SortOrder = 'ASC' | 'DESC';

export interface SortState {
  field: string;
  order: SortOrder;
}

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface RowAction<T> {
  label: string;
  onSelect: (row: T) => void;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  caption: string;

  sort?: SortState;
  onSortChange?: (sort: SortState) => void;

  onRowClick?: (row: T) => void;
  rowActions?: (row: T) => RowAction<T>[];
  getRowLabel?: (row: T) => string;
  renderRowDetails?: (row: T) => ReactNode;

  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyMessage: string;

  hasMore?: boolean;
  isLoadingMore?: boolean;
  loadMoreError?: string;
  onLoadMore?: () => void;
}
