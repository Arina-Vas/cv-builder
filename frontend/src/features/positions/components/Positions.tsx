'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import {
  DELETE_POSITION,
  POSITION_MUTATION_OPTIONS,
  POSITIONS,
} from '@/features/positions/api/positions.operations';
import type { PositionFieldsFragment } from '@/gql/graphql';
import { PositionFormModal } from '@/features/positions/components/PositionFormModal';
import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/dialog';
import { TableToolbar, type Column, DataTable } from '@/shared/components/table';

type ModalState =
  | { type: 'create' }
  | { type: 'update'; position: PositionFieldsFragment }
  | { type: 'delete'; position: PositionFieldsFragment };

export const Positions = () => {
  const t = useTranslations('positions');
  const errorMessage = useErrorMessage();

  const [modal, setModal] = useState<ModalState | null>(null);

  const { search, sort, page, pageSize, setSearch, setSort, setPage, setPageSize } = useTableParams(
    {
      sortFields: ['name'],
      defaultSort: { field: 'name', order: 'ASC' },
    },
  );

  const { data, previousData, loading, error, refetch } = useQuery(POSITIONS, {
    variables: {
      page,
      pageSize,
      search,
      sortBy: sort.field,
      sortOrder: sort.order,
    },
  });

  const shown = data ?? previousData;

  const positionsColumns: Column<PositionFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.name'),
      render: (position) => position.name,
      sortable: true,
    },
  ];

  const positionToDelete = modal?.type === 'delete' ? modal.position : undefined;

  const [deletePosition] = useMutation(DELETE_POSITION, POSITION_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!positionToDelete) return;
    await deletePosition({ variables: { id: positionToDelete.id } });
    if (page > 1 && shown?.positions.items.length === 1) setPage(page - 1);
  };

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('createButton'), onClick: () => setModal({ type: 'create' }) }}
      />
      <DataTable<PositionFieldsFragment>
        rows={shown?.positions.items ?? []}
        getRowId={(position) => position.id}
        columns={positionsColumns}
        caption={t('title')}
        emptyMessage={t('table.empty')}
        getRowLabel={(position) => position.name}
        onSortChange={setSort}
        sort={sort}
        onRetry={() => refetch()}
        error={error && errorMessage(parseError(error))}
        isLoading={loading && !shown}
        isRefreshing={loading && !!shown}
        rowActions={(position) => [
          {
            label: t('table.actions.edit'),
            onSelect: () => setModal({ type: 'update', position }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', position }),
          },
        ]}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={shown?.positions.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
      <PositionFormModal
        position={modal?.type === 'update' ? modal.position : undefined}
        onOpenChange={(open) => !open && setModal(null)}
        open={modal?.type === 'create' || modal?.type === 'update'}
      />
      <ConfirmDialog
        open={!!positionToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: positionToDelete?.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />
    </div>
  );
};
