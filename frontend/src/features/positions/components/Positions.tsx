'use client';

import { SearchField } from '@/shared/components/inputs';
import { useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable } from '@/shared/components/table';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { POSITIONS } from '@/features/positions/api/positions.operations';
import type { PositionFieldsFragment } from '@/gql/graphql';
import { PositionFormModal } from '@/features/positions/components/PositionFormModal';
import { useState } from 'react';

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

  return (
    <div>
      <SearchField value={search} onChange={setSearch} />
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
    </div>
  );
};
