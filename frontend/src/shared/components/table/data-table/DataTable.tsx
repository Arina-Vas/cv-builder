import { Fragment, useRef } from 'react';

import { IconButton } from '../../buttons';
import { ChevronIcon } from '../../icons/ChevronIcon';
import { RowActionsMenu } from '../row-actions-menu/RowActionsMenu';
import { SortableHeaderCell } from '../sortable-header-cell/SortableHeaderCell';
import { TableMessage } from '../table-message/TableMessage';
import { TableSkeleton } from '../table-skeleton/TableSkeleton';
import type { DataTableProps } from '../types';
import styles from './DataTable.module.css';
import { useScrollResetOnData } from './useScrollResetOnData';
import { useTranslations } from 'next-intl';

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
  isRefreshing = false,
  error,
  onRetry,
  emptyMessage,
  scrollResetKey,
}: DataTableProps<T>) {
  const t = useTranslations('common.table');
  const rootRef = useRef<HTMLDivElement>(null);
  const isBusy = !!isLoading || isRefreshing;

  useScrollResetOnData(rootRef, { key: scrollResetKey, rows, error, isBusy });

  const hasActionsColumn = !!rowActions || !!onRowClick;
  const columnCount = columns.length + (hasActionsColumn ? 1 : 0);

  const getRowName = (row: T) => (getRowLabel ? getRowLabel(row) : t('row', { id: getRowId(row) }));

  const renderActionsCell = (row: T) => {
    if (rowActions) {
      return (
        <RowActionsMenu
          row={row}
          actions={rowActions(row)}
          label={t('rowActions', { name: getRowName(row) })}
        />
      );
    }

    if (onRowClick) {
      return (
        <IconButton
          aria-label={t('openRow', { name: getRowName(row) })}
          onClick={() => onRowClick(row)}
        >
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
            <span className={styles.visuallyHidden}>{t('actions')}</span>
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
      <tbody className={isRefreshing ? styles.refreshing : undefined} inert={isRefreshing}>
        {rows.map((row) => {
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
    <div ref={rootRef} className={styles.root}>
      <table aria-busy={isBusy} className={styles.table}>
        <caption className={styles.visuallyHidden}>{caption}</caption>

        {renderHead()}
        {renderBody()}
      </table>

      <div role="status" className={styles.visuallyHidden}>
        {isRefreshing && t('loadingRows')}
      </div>
    </div>
  );
}
