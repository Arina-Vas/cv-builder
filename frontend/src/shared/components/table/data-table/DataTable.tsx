import { SortableHeaderCell } from '../sortable-header-cell/SortableHeaderCell';
import { TableMessage } from '../table-message/TableMessage';
import { TableSkeleton } from '../table-skeleton/TableSkeleton';
import type { DataTableProps } from '../types';
import styles from './DataTable.module.css';

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  caption,
  sort,
  onSortChange,
  isLoading,
  error,
  onRetry,
  emptyMessage,
}: DataTableProps<T>) {
  const renderBody = () => {
    if (isLoading) {
      return <TableSkeleton columnCount={columns.length} />;
    }

    if (error) {
      return (
        <TableMessage
          message={error}
          columnCount={columns.length}
          variant="error"
          onRetry={onRetry}
        />
      );
    }

    if (rows.length === 0) {
      return <TableMessage message={emptyMessage} columnCount={columns.length} />;
    }

    return (
      <tbody>
        {rows.map((row) => (
          <tr key={getRowId(row)}>
            {columns.map((column) => (
              <td key={column.key}>{column.render(row)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <table aria-busy={isLoading} className={styles.table}>
      <caption className={styles.caption}>{caption}</caption>

      <thead>
        <tr>
          {columns.map((column) => {
            const isSortable = !!column.sortable && onSortChange;

            return isSortable ? (
              <SortableHeaderCell
                key={column.key}
                field={column.key}
                header={column.header}
                width={column.width}
                sort={sort}
                onSortChange={onSortChange}
              />
            ) : (
              <th key={column.key} style={{ width: column.width }} scope="col">
                {column.header}
              </th>
            );
          })}
        </tr>
      </thead>

      {renderBody()}
    </table>
  );
}
