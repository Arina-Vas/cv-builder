import type { DataTableProps } from '../types';
import styles from './DataTable.module.css';

export function DataTable<T>({ columns, rows, getRowId, caption }: DataTableProps<T>) {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>{caption}</caption>

      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.key} style={{ width: column.width }} scope="col">
              {column.header}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row) => (
          <tr key={getRowId(row)}>
            {columns.map((column) => (
              <td key={column.key}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
