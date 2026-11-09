'use client';

import { useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { LanguageFieldsFragment } from '@/gql/graphql';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { LANGUAGES } from '@/features/languages/api/languages.operations';

export const Languages = () => {
  const t = useTranslations('languages');
  const errorMessage = useErrorMessage();

  const { search, sort, page, pageSize, setSearch, setSort, setPage, setPageSize } = useTableParams(
    {
      sortFields: ['name', 'iso'],
      defaultSort: { field: 'name', order: 'ASC' },
    },
  );

  const { data, previousData, loading, error, refetch } = useQuery(LANGUAGES, {
    variables: {
      page,
      pageSize,
      search,
      sortBy: sort.field,
      sortOrder: sort.order,
    },
  });

  const shown = data ?? previousData;

  const languagesColumns: Column<LanguageFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.columns.name'),
      render: (language) => language.name,
      sortable: true,
    },
    {
      key: 'iso',
      header: t('table.columns.iso'),
      render: (language) => language.iso,
      sortable: true,
    },
    {
      key: 'nativeName',
      header: t('table.columns.nativeName'),
      render: (language) => language.nativeName,
    },
  ];

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('createButton'), onClick: () => {} }}
      />
      <DataTable<LanguageFieldsFragment>
        rows={shown?.languages.items ?? []}
        getRowId={(language) => language.id}
        columns={languagesColumns}
        caption={t('title')}
        emptyMessage={t('table.empty')}
        getRowLabel={(language) => language.name}
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
        total={shown?.languages.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
