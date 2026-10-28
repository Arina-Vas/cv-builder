import { SortOrder } from './sort-order.enum';

export const PAGE_SIZES = [10, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;
export const DEFAULT_PAGE = 1;
export const DEFAULT_SORT_ORDER = SortOrder.ASC;
export const MAX_SEARCH_LENGTH = 100;
export const MAX_NAME_LENGTH = 100;
