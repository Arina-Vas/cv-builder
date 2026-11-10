'use client';

import { useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { SkillFieldsFragment } from '@/gql/graphql';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { SKILLS } from '@/features/skills/api/skills.operations';

export const Skills = () => {
  const t = useTranslations('skills');
  const errorMessage = useErrorMessage();

  const { search, sort, page, pageSize, setSearch, setSort, setPage, setPageSize } = useTableParams(
    {
      sortFields: ['name'],
      defaultSort: { field: 'name', order: 'ASC' },
    },
  );

  const { data, previousData, loading, error, refetch } = useQuery(SKILLS, {
    variables: {
      page,
      pageSize,
      search,
      sortBy: sort.field,
      sortOrder: sort.order,
    },
  });

  const shown = data ?? previousData;

  const skillsColumns: Column<SkillFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.columns.name'),
      render: (skill) => skill.name,
      sortable: true,
    },
    {
      key: 'type',
      header: t('table.columns.type'),
      render: (skill) => skill.category.type,
    },
    {
      key: 'category',
      header: t('table.columns.category'),
      render: (skill) => skill.category.name,
    },
  ];

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('createButton'), onClick: () => {} }}
      />
      <DataTable<SkillFieldsFragment>
        rows={shown?.skills.items ?? []}
        getRowId={(skill) => skill.id}
        columns={skillsColumns}
        caption={t('title')}
        emptyMessage={t('table.empty')}
        getRowLabel={(skill) => skill.name}
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
        total={shown?.skills.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
    </div>
  );
};
