import styles from './TableSkeleton.module.css';

export interface TableSkeletonProps {
  columnCount: number;
  rowCount?: number;
}

export function TableSkeleton({ columnCount, rowCount = 5 }: TableSkeletonProps) {
  const placeholderRows = Array.from({ length: rowCount }, (_, index) => index);

  return (
    <tbody className={styles.skeleton} aria-hidden="true">
      {placeholderRows.map((index) => (
        <tr key={index} className={styles.row}>
          <td colSpan={columnCount} className={styles.cell}>
            <span className={styles.bar} />
          </td>
        </tr>
      ))}
    </tbody>
  );
}
