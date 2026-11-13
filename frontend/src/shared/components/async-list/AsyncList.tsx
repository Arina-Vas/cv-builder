import type { ReactNode } from 'react';
import { Button } from '@/shared/components/buttons';
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
import s from './AsyncList.module.css';

const SKELETON_ITEMS = 3;

type Props<T> = {
  items: T[] | undefined;
  error: unknown;
  loading: boolean;
  onRetry: () => void;
  loadErrorMessage: string;
  retryLabel: string;
  loadingLabel: string;
  emptyMessage: string;
  children: ReactNode;
};

export const AsyncList = <T,>({
  items,
  error,
  loading,
  onRetry,
  loadErrorMessage,
  retryLabel,
  loadingLabel,
  emptyMessage,
  children,
}: Props<T>) => {
  if (error && !items) {
    return (
      <div className={s.error} role="alert">
        <p className={s.errorText}>{loadErrorMessage}</p>
        <Button variant="secondary" size="sm" loading={loading} onClick={onRetry}>
          {retryLabel}
        </Button>
      </div>
    );
  }

  if (!items) {
    return (
      <ul className={s.list} aria-busy="true" aria-label={loadingLabel}>
        {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
          <li key={index} className={s.skeletonItem}>
            <Skeleton className={s.skeletonBar} />
            <Skeleton className={s.skeletonName} />
          </li>
        ))}
      </ul>
    );
  }

  if (items.length === 0) {
    return <p className={s.empty}>{emptyMessage}</p>;
  }

  return <>{children}</>;
};
