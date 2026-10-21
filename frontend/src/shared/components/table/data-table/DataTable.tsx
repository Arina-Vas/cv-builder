import type { DataTableProps } from '../types';
import styles from './DataTable.module.css';

export function DataTable<T>(_props: DataTableProps<T>) {
  return <table className={styles.table} />;
}
