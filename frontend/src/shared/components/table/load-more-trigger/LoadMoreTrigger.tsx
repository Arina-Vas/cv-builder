import { useEffect, useEffectEvent, useRef } from 'react';

import { TableMessage } from '../table-message/TableMessage';
import { TableSkeleton } from '../table-skeleton/TableSkeleton';
import styles from './LoadMoreTrigger.module.css';

export interface LoadMoreTriggerProps {
  columnCount: number;
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
  onLoadMore: () => void;
}

export function LoadMoreTrigger({
  columnCount,
  hasMore,
  isLoading,
  error,
  onLoadMore,
}: LoadMoreTriggerProps) {
  const sentinelRef = useRef<HTMLTableCellElement>(null);
  const loadMore = useEffectEvent(onLoadMore);

  const isWaiting = hasMore && !isLoading && !error;

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!isWaiting || !sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { rootMargin: '0px 0px 200px 0px' },
    );

    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [isWaiting]);

  if (isLoading) {
    return <TableSkeleton columnCount={columnCount} rowCount={1} />;
  }

  if (error) {
    return (
      <TableMessage
        message={error}
        columnCount={columnCount}
        variant="error"
        onRetry={onLoadMore}
      />
    );
  }

  if (!hasMore) return null;

  return (
    <tbody className={styles.trigger} aria-hidden="true">
      <tr className={styles.row}>
        <td ref={sentinelRef} colSpan={columnCount} className={styles.cell} />
      </tr>
    </tbody>
  );
}
