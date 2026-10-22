import { RowActionsMenu } from '../row-actions-menu/RowActionsMenu';
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
  rowActions,
  getRowLabel,
  isLoading,
  error,
  onRetry,
  emptyMessage,
}: DataTableProps<T>) {
  const hasRowActions = !!rowActions;
  const columnCount = columns.length + (hasRowActions ? 1 : 0);

  const getActionsLabel = (row: T) =>
    `Actions for ${getRowLabel ? getRowLabel(row) : `row ${getRowId(row)}`}`;

  const renderBody = () => {
    if (isLoading) {
      return <TableSkeleton columnCount={columnCount} />;
    }

    if (error) {
      return (
        <TableMessage message={error} columnCount={columnCount} variant="error" onRetry={onRetry} />
      );
    }

    if (rows.length === 0) {
      return <TableMessage message={emptyMessage} columnCount={columnCount} />;
    }

    return (
      <tbody>
        {rows.map((row) => (
          <tr key={getRowId(row)}>
            {columns.map((column) => (
              <td key={column.key}>{column.render(row)}</td>
            ))}
            {hasRowActions && (
              <td className={styles.actionsCell}>
                <RowActionsMenu row={row} actions={rowActions(row)} label={getActionsLabel(row)} />
              </td>
            )}
          </tr>
        ))}
      </tbody>
    );
  };

  return (
    <table aria-busy={isLoading} className={styles.table}>
      <caption className={styles.visuallyHidden}>{caption}</caption>

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
          {hasRowActions && (
            <th scope="col" className={styles.actionsCell}>
              <span className={styles.visuallyHidden}>Actions</span>
            </th>
          )}
        </tr>
      </thead>

      {renderBody()}
    </table>
  );
}
