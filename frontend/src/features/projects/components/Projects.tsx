'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { ProjectFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import {
  DELETE_PROJECT,
  PROJECT_MUTATION_OPTIONS,
  PROJECTS,
} from '@/features/projects/api/projects.operations';
import { parseISO, format } from 'date-fns';
import { ProjectDetails } from '@/features/projects/components/projectDetails/ProjectDetails';
import { useState } from 'react';
import { ProjectFormModal } from '@/features/projects/components/ProjectFormModal';
import { ConfirmDialog } from '@/shared/components/dialog';

type ModalState =
  | { type: 'create' }
  | { type: 'update'; project: ProjectFieldsFragment }
  | { type: 'delete'; project: ProjectFieldsFragment };

export const Projects = () => {
  const t = useTranslations('projects');
  const errorMessage = useErrorMessage();

  const [modal, setModal] = useState<ModalState | null>(null);

  const { search, sort, setSearch, setSort } = useTableParams({
    sortFields: ['name', 'startDate', 'endDate'],
    defaultSort: { field: 'name', order: 'ASC' },
  });

  const { data, previousData, loading, error, refetch } = useQuery(PROJECTS, {
    variables: {
      search,
      sortBy: sort.field,
      sortOrder: sort.order,
    },
  });

  const shown = data ?? previousData;

  const projectsColumns: Column<ProjectFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.columns.name'),
      render: (project) => project.name,
      sortable: true,
    },
    {
      key: 'domain',
      header: t('table.columns.domain'),
      render: (project) => project.domain,
    },
    {
      key: 'startDate',
      header: t('table.columns.startDate'),
      render: (project) => format(parseISO(project.startDate), 'MM/dd/yyyy'),
      sortable: true,
    },
    {
      key: 'endDate',
      header: t('table.columns.endDate'),
      render: (project) => format(parseISO(project.endDate), 'MM/dd/yyyy'),
      sortable: true,
    },
  ];

  const projectToDelete = modal?.type === 'delete' ? modal.project : undefined;

  const [deleteProject] = useMutation(DELETE_PROJECT, PROJECT_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!projectToDelete) return;
    await deleteProject({ variables: { id: projectToDelete.id } });
  };

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={{ label: t('createButton'), onClick: () => setModal({ type: 'create' }) }}
      />
      <DataTable<ProjectFieldsFragment>
        rows={shown?.projects.items ?? []}
        getRowId={(project) => project.id}
        columns={projectsColumns}
        caption={t('title')}
        emptyMessage={t('table.empty')}
        getRowLabel={(project) => project.name}
        onSortChange={setSort}
        sort={sort}
        onRetry={() => refetch()}
        error={error && errorMessage(parseError(error))}
        isLoading={loading && !shown}
        isRefreshing={loading && !!shown}
        renderRowDetails={(project) => <ProjectDetails project={project} />}
        rowActions={(project) => [
          {
            label: t('table.actions.edit'),
            onSelect: () => setModal({ type: 'update', project }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', project }),
          },
        ]}
      />

      <ProjectFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        project={modal?.type === 'update' ? modal.project : undefined}
        onOpenChange={(open) => !open && setModal(null)}
      />

      <ConfirmDialog
        open={!!projectToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: projectToDelete?.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />
    </div>
  );
};
