'use client';

import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { CvFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { Pagination } from '@/shared/components/pagination';
import { useCvList } from '@/features/cvs/hooks/useCvList';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useState } from 'react';
import { CvFormModal } from '@/features/cvs/components/CvFormModal';
import { ConfirmDialog } from '@/shared/components/dialog';
import { useMutation } from '@apollo/client/react';

import { CV_MUTATION_OPTIONS, CVS, DELETE_CV, USER_CVS } from '@/features/cvs/api/cvs.operations';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { UserNotFound } from '@/features/users/components/UserNotFound';

type Props = {
  userId?: string;
};

type ModalState =
  | { type: 'create' }
  | { type: 'update'; cv: CvFieldsFragment }
  | { type: 'delete'; cv: CvFieldsFragment };

export const Cvs = ({ userId }: Props) => {
  const t = useTranslations('cvs');
  const { user, loading: userLoading } = useCurrentUser();
  const router = useRouter();
  const withRefetch = useRefetchOnError([CVS, USER_CVS], ['NOT_FOUND']);

  const [modal, setModal] = useState<ModalState | null>(null);

  const { tableParams, pagination, rows, isUserNotFound, tableState } = useCvList(userId);

  const { search, setSort, sort, setSearch } = tableParams;

  const cvsColumns: Column<CvFieldsFragment>[] = [
    {
      key: 'name',
      header: t('table.columns.name'),
      render: (cv) => cv.name,
      sortable: true,
    },
    {
      key: 'education',
      header: t('table.columns.education'),
      render: (cv) => cv.education,
    },
    {
      key: 'employee',
      header: t('table.columns.employee'),
      render: (cv) => cv.user.email,
    },
  ];

  const ownerId = userId ?? user?.id;

  const cvToDelete = modal?.type === 'delete' ? modal.cv : undefined;

  const [deleteCv] = useMutation(DELETE_CV, CV_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!cvToDelete) return;
    await withRefetch(() =>
      deleteCv({ variables: { id: cvToDelete.id, userId: cvToDelete.user.id } }),
    );
  };

  if (isUserNotFound) return <UserNotFound />;

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={
          ownerId
            ? { label: t('createButton'), onClick: () => setModal({ type: 'create' }) }
            : undefined
        }
      />
      <DataTable<CvFieldsFragment>
        scrollResetKey={tableParams.page}
        {...tableState}
        // The empty text depends on the role: wait for ME instead of guessing it
        isLoading={tableState.isLoading || (userLoading && !user)}
        rows={rows}
        getRowId={(cv) => cv.id}
        columns={cvsColumns}
        caption={t('title')}
        emptyMessage={
          user && user.role !== 'ADMIN' && !search ? t('table.userEmpty') : t('table.empty')
        }
        getRowLabel={(cv) => cv.name}
        onSortChange={setSort}
        sort={sort}
        renderRowDetails={(cv) => <p>{cv.description}</p>}
        rowActions={(cv) => [
          {
            label: t('table.actions.view'),
            onSelect: () => router.push(`/cvs/${cv.id}/details`),
            ungated: true,
          },
          {
            label: t('table.actions.edit'),
            onSelect: () => setModal({ type: 'update', cv }),
          },
          {
            label: t('table.actions.delete'),
            onSelect: () => setModal({ type: 'delete', cv }),
          },
        ]}
      />
      <Pagination {...pagination} />

      {ownerId && (
        <CvFormModal
          open={modal?.type === 'create' || modal?.type === 'update'}
          onOpenChange={(open) => !open && setModal(null)}
          userId={ownerId}
          cv={modal?.type === 'update' ? modal.cv : undefined}
        />
      )}

      <ConfirmDialog
        open={!!cvToDelete}
        onOpenChange={(open) => !open && setModal(null)}
        title={t('delete.title')}
        message={t.rich('delete.message', {
          name: cvToDelete?.name ?? '',
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDelete}
      />
    </div>
  );
};
