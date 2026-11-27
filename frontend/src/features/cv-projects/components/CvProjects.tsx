'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { CvProjectFieldsFragment } from '@/gql/graphql';
import {
  CV_PROJECT_MUTATION_OPTIONS,
  CV_PROJECT_REFETCH_ERROR_CODES,
  CV_PROJECT_REFETCH_QUERIES,
  CV_PROJECTS,
  DELETE_CV_PROJECT,
} from '@/features/cv-projects/api/cvProjects.operations';
import { CvProjectDetails } from '@/features/cv-projects/components/cvProjectDetails/CvProjectDetails';
import { CvProjectFormModal } from '@/features/cv-projects/components/CvProjectFormModal';
import { ConfirmDialog } from '@/shared/components/dialog';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { formatDate } from '@/shared/lib/date/format-date';
import s from './CvProjects.module.css';
import { effectiveEndDate } from '@/features/cv-projects/lib/effective-end-date';
import { CvNotFound } from '@/features/cvs/components/CvNotFound';

type ModalState =
  | { type: 'add' }
  | { type: 'update'; cvProject: CvProjectFieldsFragment }
  | { type: 'delete'; cvProject: CvProjectFieldsFragment };

type Props = {
  cvId: string;
};

export const CvProjects = ({ cvId }: Props) => {
  const t = useTranslations('cvProjects');
  const [modal, setModal] = useState<ModalState | null>(null);

  const { search, sort, setSearch, setSort } = useTableParams({
    sortFields: ['name', 'startDate', 'endDate'],
    defaultSort: { field: 'name', order: 'ASC' },
  });

  const { data, previousData, loading, error, refetch } = useQuery(CV_PROJECTS, {
    variables: { cvId, search, sortBy: sort.field, sortOrder: sort.order },
  });

  const shown = data ?? previousData;

  const withRefetch = useRefetchOnError(CV_PROJECT_REFETCH_QUERIES, CV_PROJECT_REFETCH_ERROR_CODES);
  const [deleteCvProject] = useMutation(DELETE_CV_PROJECT, CV_PROJECT_MUTATION_OPTIONS);

  const cvProjectToDelete = modal?.type === 'delete' ? modal.cvProject : undefined;

  const handleDelete = async () => {
    if (!cvProjectToDelete) return;
    await withRefetch(() => deleteCvProject({ variables: { id: cvProjectToDelete.id, cvId } }));
  };

  if (hasErrorCode(error, 'NOT_FOUND')) return <CvNotFound />;

  const forbidden = hasErrorCode(error, 'FORBIDDEN');

  const columns: Column<CvProjectFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.columns.name'),
      render: (cvProject) => cvProject.project.name,
      sortable: true,
    },
    {
      key: 'domain',
      header: t('table.columns.domain'),
      render: (cvProject) => cvProject.project.domain,
      hideOnTablet: true,
    },
    {
      key: 'startDate',
      width: '140px',
      header: t('table.columns.startDate'),
      render: (cvProject) => formatDate(cvProject.startDate),
      sortable: true,
    },
    {
      key: 'endDate',
      width: '140px',
      header: t('table.columns.endDate'),
      render: (cvProject) => {
        const endDate = effectiveEndDate(cvProject);
        return endDate ? formatDate(endDate) : t('table.tillNow');
      },
      sortable: true,
    },
  ];

  return (
    <div className={s.root}>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('addButton'), onClick: () => setModal({ type: 'add' }) }}
      />
      <DataTable<CvProjectFieldsFragment>
        rows={shown?.cvProjects.items ?? []}
        getRowId={(cvProject) => cvProject.id}
        columns={columns}
        caption={t('title')}
        emptyMessage={search ? t('table.noResults') : t('table.empty')}
        getRowLabel={(cvProject) => cvProject.project.name}
        onSortChange={setSort}
        sort={sort}
        error={error && (forbidden ? t('forbidden') : t('loadError'))}
        onRetry={forbidden ? undefined : () => refetch()}
        isLoading={loading && !shown}
        isRefreshing={loading && !!shown}
        renderRowDetails={(cvProject) => <CvProjectDetails cvProject={cvProject} />}
        rowActions={(cvProject) => [
          {
            label: t('table.actions.update'),
            onSelect: () => setModal({ type: 'update', cvProject }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', cvProject }),
          },
        ]}
      />

      <CvProjectFormModal
        open={modal?.type === 'add' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        cvId={cvId}
        cvProject={modal?.type === 'update' ? modal.cvProject : undefined}
      />

      <ConfirmDialog
        open={!!cvProjectToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: cvProjectToDelete?.project.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />
    </div>
  );
};
