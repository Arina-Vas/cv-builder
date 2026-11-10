'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { SkillFieldsFragment } from '@/gql/graphql';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import {
  DELETE_SKILL,
  SKILL_MUTATION_OPTIONS,
  SKILLS,
} from '@/features/skills/api/skills.operations';
import { useState } from 'react';
import { SkillFormModal } from '@/features/skills/components/SkillFormModal';
import { ConfirmDialog } from '@/shared/components/dialog';

type ModalState =
  | { type: 'create' }
  | { type: 'update'; skill: SkillFieldsFragment }
  | { type: 'delete'; skill: SkillFieldsFragment };

export const Skills = () => {
  const t = useTranslations('skills');
  const errorMessage = useErrorMessage();

  const [modal, setModal] = useState<ModalState | null>(null);

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

  const skillToDelete = modal?.type === 'delete' ? modal.skill : undefined;

  const [deleteSkill] = useMutation(DELETE_SKILL, SKILL_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!skillToDelete) return;
    await deleteSkill({ variables: { id: skillToDelete.id } });
    if (page > 1 && shown?.skills.items.length === 1) setPage(page - 1);
  };

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('createButton'), onClick: () => setModal({ type: 'create' }) }}
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
        rowActions={(skill) => [
          {
            label: t('table.actions.edit'),
            onSelect: () => setModal({ type: 'update', skill }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', skill }),
          },
        ]}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={shown?.skills.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
      <SkillFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        skill={modal?.type === 'update' ? modal.skill : undefined}
      />
      <ConfirmDialog
        open={!!skillToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: skillToDelete?.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />
    </div>
  );
};
