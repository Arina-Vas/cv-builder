import { Fragment } from 'react';

import { IconButton } from '../../buttons';
import { ChevronIcon } from '../../icons/ChevronIcon';
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
  onRowClick,
  rowActions,
  getRowLabel,
  renderRowDetails,
  isLoading,
  error,
  onRetry,
  emptyMessage,
}: DataTableProps<T>) {
  // Last column: ⋮ menu (rowActions) or › open arrow (onRowClick); the menu wins if both are passed
  const hasActionsColumn = !!rowActions || !!onRowClick;
  const columnCount = columns.length + (hasActionsColumn ? 1 : 0);

  const getRowName = (row: T) => (getRowLabel ? getRowLabel(row) : `row ${getRowId(row)}`);

  const renderActionsCell = (row: T) => {
    if (rowActions) {
      return (
        <RowActionsMenu
          row={row}
          actions={rowActions(row)}
          label={`Actions for ${getRowName(row)}`}
        />
      );
    }

    if (onRowClick) {
      return (
        <IconButton aria-label={`Open ${getRowName(row)}`} onClick={() => onRowClick(row)}>
          <ChevronIcon direction="right" />
        </IconButton>
      );
    }

    return null;
  };

  const renderHead = () => (
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
        {hasActionsColumn && (
          <th scope="col" className={styles.actionsCell}>
            <span className={styles.visuallyHidden}>Actions</span>
          </th>
        )}
      </tr>
    </thead>
  );

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
        {rows.map((row) => {
          // null/undefined/'' → no details row, so an empty one never removes the row's bottom line
          const details = renderRowDetails?.(row);
          const hasDetails = details !== null && details !== undefined && details !== '';

          return (
            <Fragment key={getRowId(row)}>
              <tr>
                {columns.map((column) => (
                  <td key={column.key}>{column.render(row)}</td>
                ))}
                {hasActionsColumn && (
                  <td className={styles.actionsCell}>{renderActionsCell(row)}</td>
                )}
              </tr>
              {hasDetails && (
                <tr className={styles.detailsRow}>
                  <td colSpan={columnCount}>{details}</td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    );
  };

  return (
    <table aria-busy={isLoading} className={styles.table}>
      <caption className={styles.visuallyHidden}>{caption}</caption>

      {renderHead()}
      {renderBody()}
    </table>
  );
}
