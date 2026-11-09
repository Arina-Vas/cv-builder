'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { LanguageFieldsFragment } from '@/gql/graphql';
import { Pagination } from '@/shared/components/pagination';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import {
  DELETE_LANGUAGE,
  LANGUAGE_MUTATION_OPTIONS,
  LANGUAGES,
} from '@/features/languages/api/languages.operations';
import { LanguageFormModal } from '@/features/languages/components/LanguageFormModal';
import { useState } from 'react';
import { ConfirmDialog } from '@/shared/components/dialog';

type ModalState =
  | { type: 'create' }
  | { type: 'update'; language: LanguageFieldsFragment }
  | { type: 'delete'; language: LanguageFieldsFragment };

export const Languages = () => {
  const t = useTranslations('languages');
  const errorMessage = useErrorMessage();

  const [modal, setModal] = useState<ModalState | null>(null);

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

  const languageToDelete = modal?.type === 'delete' ? modal.language : undefined;

  const [deleteLanguage] = useMutation(DELETE_LANGUAGE, LANGUAGE_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!languageToDelete) return;
    await deleteLanguage({ variables: { id: languageToDelete.id } });
    if (page > 1 && shown?.languages.items.length === 1) setPage(page - 1);
  };

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{
          label: t('createButton'),
          onClick: () => setModal({ type: 'create' }),
        }}
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
        rowActions={(language) => [
          {
            label: t('table.actions.edit'),
            onSelect: () => setModal({ type: 'update', language }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', language }),
          },
        ]}
      />
      <Pagination
        page={page}
        pageSize={pageSize}
        total={shown?.languages.total ?? 0}
        onPageSizeChange={setPageSize}
        onPageChange={setPage}
      />
      <LanguageFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        language={modal?.type === 'update' ? modal.language : undefined}
      />
      <ConfirmDialog
        open={!!languageToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: languageToDelete?.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />
    </div>
  );
};
