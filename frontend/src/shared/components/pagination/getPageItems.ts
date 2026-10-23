export type PageItem = number | 'start-ellipsis' | 'end-ellipsis';

const MAX_ITEMS = 7;
const EDGE_RUN = 5;

export function getPageItems(page: number, pageCount: number): PageItem[] {
  if (pageCount <= MAX_ITEMS) {
    return range(1, pageCount);
  }

  if (page <= EDGE_RUN - 1) {
    return [...range(1, EDGE_RUN), 'end-ellipsis', pageCount];
  }

  if (page >= pageCount - EDGE_RUN + 2) {
    return [1, 'start-ellipsis', ...range(pageCount - EDGE_RUN + 1, pageCount)];
  }

  return [1, 'start-ellipsis', page - 1, page, page + 1, 'end-ellipsis', pageCount];
}

export function getPageCount(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function range(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, index) => from + index);
}
