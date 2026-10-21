import styles from './TableSkeleton.module.css';

export interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export function TableSkeleton(_props: TableSkeletonProps) {
  return <tbody className={styles.skeleton} />;
}
