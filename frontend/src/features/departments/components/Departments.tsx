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

export const Departments = () => {
  const t = useTranslations('departments');
  const errorMessage = useErrorMessage();

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
      <SearchField value={search} onChange={setSearch} />
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
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={shown?.departments.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
