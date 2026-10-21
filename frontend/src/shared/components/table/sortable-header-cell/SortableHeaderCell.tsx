import type { SortState } from '../types';
import styles from './SortableHeaderCell.module.css';

export interface SortableHeaderCellProps {
  field: string;
  header: string;
  sort?: SortState;
  onSortChange: (sort: SortState) => void;
}

export function SortableHeaderCell(_props: SortableHeaderCellProps) {
  return <th className={styles.cell} />;
}
