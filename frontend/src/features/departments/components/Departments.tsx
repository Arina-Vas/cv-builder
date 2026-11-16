'use client';

import {
  DELETE_DEPARTMENT,
  DEPARTMENT_MUTATION_OPTIONS,
  DEPARTMENTS,
} from '@/features/departments/api/departments.operations';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { DepartmentFieldsFragment } from '@/gql/graphql';
import { Pagination, usePagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useState } from 'react';
import { DepartmentFormModal } from '@/features/departments/components/DepartmentFormModal';
import { ConfirmDialog } from '@/shared/components/dialog';

type ModalState =
  | { type: 'create' }
  | { type: 'update'; department: DepartmentFieldsFragment }
  | { type: 'delete'; department: DepartmentFieldsFragment };

export const Departments = () => {
  const t = useTranslations('departments');
  const errorMessage = useErrorMessage();

  const [modal, setModal] = useState<ModalState | null>(null);

  const tableParams = useTableParams({
    sortFields: ['name'],
    defaultSort: { field: 'name', order: 'ASC' },
  });

  const { search, sort, page, pageSize, setSearch, setSort } = tableParams;

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

  const pagination = usePagination(tableParams, {
    total: shown?.departments.total,
    freshTotal: data?.departments.total,
  });

  const departmentToDelete = modal?.type === 'delete' ? modal.department : null;

  const departmentsColumns: Column<DepartmentFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.name'),
      render: (department) => department.name,
      sortable: true,
    },
  ];

  const [deleteDepartment] = useMutation(DELETE_DEPARTMENT, DEPARTMENT_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!departmentToDelete) return;
    await deleteDepartment({ variables: { id: departmentToDelete.id } });
  };

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('createButton'), onClick: () => setModal({ type: 'create' }) }}
      />

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
      <Pagination {...pagination} />

      <ConfirmDialog
        open={!!departmentToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: departmentToDelete?.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />

      <DepartmentFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        department={modal?.type === 'update' ? modal.department : undefined}
      />
    </div>
  );
};
