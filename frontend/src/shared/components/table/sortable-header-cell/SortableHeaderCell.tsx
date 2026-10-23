import { ArrowUpIcon } from '../../icons/ArrowUpIcon';
import type { SortState } from '../types';
import styles from './SortableHeaderCell.module.css';

export interface SortableHeaderCellProps {
  field: string;
  header: string;
  sort?: SortState;
  width?: string;
  onSortChange: (sort: SortState) => void;
}

export function SortableHeaderCell({
  field,
  header,
  sort,
  width,
  onSortChange,
}: SortableHeaderCellProps) {
  const isActive = sort?.field === field;
  const ariaSort = !isActive ? 'none' : sort.order === 'ASC' ? 'ascending' : 'descending';

  const handleClick = () => {
    const order = isActive && sort.order === 'ASC' ? 'DESC' : 'ASC';
    onSortChange({ field, order });
  };

  const iconClasses = [
    styles.icon,
    isActive && styles.active,
    isActive && sort.order === 'DESC' && styles.desc,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <th style={{ width }} aria-sort={ariaSort} scope="col" className={styles.cell}>
      <button className={styles.button} type="button" onClick={handleClick}>
        {header}
        <ArrowUpIcon className={iconClasses} />
      </button>
    </th>
  );
}
