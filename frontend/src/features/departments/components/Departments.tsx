'use client';

import { SearchField } from '@/shared/components/inputs';
import { DEPARTMENTS } from '@/features/departments/api/departments.operations';
import { useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable } from '@/shared/components/table';
import type { DepartmentFieldsFragment } from '@/gql/graphql';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useState } from 'react';
import { DepartmentFormModal } from '@/features/departments/components/DepartmentFormModal';
import { DeleteDepartmentDialog } from '@/features/departments/components/DeleteDepartmentDialog';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { Button } from '@/shared/components/buttons';
import s from './Departments.module.css';

type ModalState =
  | { type: 'create' }
  | { type: 'update'; department: DepartmentFieldsFragment }
  | { type: 'delete'; department: DepartmentFieldsFragment };

export const Departments = () => {
  const t = useTranslations('departments');
  const errorMessage = useErrorMessage();

  const [modal, setModal] = useState<ModalState | null>(null);

  const { search, sort, page, pageSize, setSearch, setSort, setPage, setPageSize } = useTableParams(
    {
      sortFields: ['name'],
      defaultSort: { field: 'name', order: 'ASC' },
    },
  );

  const { data, previousData, loading, error, refetch } = useQuery(DEPARTMENTS, {
    variables: {
      page,
      pageSize,
      search,
      sortBy: sort.field,
      sortOrder: sort.order,
    },
  });

  const shown = data ?? previousData;

  const departmentToDelete = modal?.type === 'delete' ? modal.department : null;

  const departmentsColumns: Column<DepartmentFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.name'),
      render: (department) => department.name,
      sortable: true,
    },
  ];

  return (
    <div>
      <div className={s.header}>
        <SearchField value={search} onChange={setSearch} />
        <Button variant={'text'} onClick={() => setModal({ type: 'create' })} size={'sm'}>
          <span className={s.withIcon}>
            <PlusIcon />
            {t('createButton')}
          </span>
        </Button>
      </div>

      <DataTable<DepartmentFieldsFragment>
        rows={shown?.departments.items ?? []}
        getRowId={(department) => department.id}
        columns={departmentsColumns}
        caption={t('title')}
        emptyMessage={t('table.empty')}
        getRowLabel={(department) => department.name}
        onSortChange={setSort}
        sort={sort}
        onRetry={() => refetch()}
        error={error && errorMessage(parseError(error))}
        isLoading={loading && !shown}
        isRefreshing={loading && !!shown}
        rowActions={(department) => [
          {
            label: t('table.actions.edit'),
            onSelect: () => setModal({ type: 'update', department }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', department }),
          },
        ]}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={shown?.departments.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />

      <DeleteDepartmentDialog
        department={departmentToDelete}
        onClose={() => setModal(null)}
        onDeleted={() => {
          if (page > 1 && shown?.departments.items.length === 1) setPage(page - 1);
        }}
      />

      <DepartmentFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        department={modal?.type === 'update' ? modal.department : undefined}
      />
    </div>
  );
};
