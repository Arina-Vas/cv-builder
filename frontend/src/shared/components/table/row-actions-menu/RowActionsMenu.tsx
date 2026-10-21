import type { RowAction } from '../types';
import styles from './RowActionsMenu.module.css';

export interface RowActionsMenuProps<T> {
  row: T;
  actions: RowAction<T>[];
  label: string;
}

export function RowActionsMenu<T>(_props: RowActionsMenuProps<T>) {
  return <div className={styles.menu} />;
}
