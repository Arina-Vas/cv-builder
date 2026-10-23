import { Select } from 'radix-ui';

import { ChevronIcon } from '../icons/ChevronIcon';
import { getPageCount, getPageItems } from './getPageItems';
import styles from './Pagination.module.css';

export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50];

export interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
  label?: string;
}

export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  label = 'Pagination',
}: PaginationProps) {
  const smallestPageSize = Math.min(...pageSizeOptions, pageSize);
  if (total <= smallestPageSize) {
    return null;
  }

  const pageCount = getPageCount(total, pageSize);

  const pageItemClass = `${styles.item} ${styles.page}`;
  const arrowClass = `${styles.item} ${styles.arrow}`;

  return (
    <nav aria-label={label} className={styles.pagination}>
      <ul className={styles.pages}>
        <li>
          <button
            type="button"
            className={arrowClass}
            aria-label="Previous page"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronIcon direction="left" />
          </button>
        </li>

        {getPageItems(page, pageCount).map((item) =>
          typeof item === 'number' ? (
            <li key={item}>
              <button
                type="button"
                className={pageItemClass}
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                onClick={() => item !== page && onPageChange(item)}
              >
                {item}
              </button>
            </li>
          ) : (
            <li key={item} aria-hidden="true">
              <span className={`${styles.item} ${styles.ellipsis}`}>…</span>
            </li>
          ),
        )}

        <li>
          <button
            type="button"
            className={arrowClass}
            aria-label="Next page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronIcon direction="right" />
          </button>
        </li>
      </ul>

      <Select.Root
        value={String(pageSize)}
        onValueChange={(value) => onPageSizeChange(Number(value))}
      >
        <Select.Trigger className={styles.sizeTrigger} aria-label="Rows per page">
          <Select.Value />
          <Select.Icon asChild>
            <ChevronIcon direction="down" className={styles.sizeIcon} />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Content position="popper" side="bottom" className={styles.sizeContent}>
            <Select.Viewport>
              {pageSizeOptions.map((option) => (
                <Select.Item key={option} value={String(option)} className={styles.sizeItem}>
                  <Select.ItemText>{option}</Select.ItemText>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </nav>
  );
}
