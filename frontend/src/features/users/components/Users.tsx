'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import type { UserListFieldsFragment, UserSortField } from '@/gql/graphql';
import { DELETE_USER, USER_MUTATION_OPTIONS, USERS } from '@/features/users/api/users.operations';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { getFullName } from '@/features/users/lib/getFullName';
import { useTableParams } from '@/shared/hooks/useTableParams';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import { Pagination } from '@/shared/components/pagination';
import { Avatar } from '@/shared/components/avatar/Avatar';
import { ConfirmDialog } from '@/shared/components/dialog';
import { UserFormModal } from './UserFormModal';

const SORT_FIELDS: readonly UserSortField[] = [
  'firstName',
  'lastName',
  'department',
  'position',
  'createdAt',
];

type ModalState =
  | { type: 'create' }
  | { type: 'update'; user: UserListFieldsFragment }
  | { type: 'delete'; user: UserListFieldsFragment };

export const Users = () => {
  const t = useTranslations('users');
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const { user: currentUser } = useCurrentUser();
  const isAdmin = currentUser?.role === 'ADMIN';

  const [modal, setModal] = useState<ModalState | null>(null);

  const { search, sort, page, pageSize, setSearch, setSort, setPage, setPageSize } =
    useTableParams<UserSortField>({
      sortFields: SORT_FIELDS,
      defaultSort: { field: 'createdAt', order: 'DESC' },
    });

  const { data, previousData, loading, error, refetch } = useQuery(USERS, {
    variables: {
      page,
      pageSize,
      search,
      sortBy: sort.field,
      sortOrder: sort.order,
    },
  });

  const shown = data ?? previousData;

  const openUser = (user: UserListFieldsFragment) => router.push(`/users/${user.id}`);

  const userToDelete = modal?.type === 'delete' ? modal.user : null;
  const [deleteUser] = useMutation(DELETE_USER, USER_MUTATION_OPTIONS);

  const handleDelete = async () => {
    if (!userToDelete) return;
    await deleteUser({ variables: { id: userToDelete.id } });
    if (page > 1 && shown?.users.items.length === 1) setPage(page - 1);
  };

  const usersColumns: Column<UserListFieldsFragment>[] = [
    {
      key: 'avatar',
      header: t('table.avatar'),
      hideHeader: true,
      render: (user) => (
        <Avatar src={user.avatarUrl ?? undefined} fallback={getFullName(user)} size="md" />
      ),
      width: '72px',
    },
    {
      key: 'firstName',
      header: t('table.firstName'),
      render: (user) => user.firstName,
      sortable: true,
    },
    {
      key: 'lastName',
      header: t('table.lastName'),
      render: (user) => user.lastName,
      sortable: true,
    },
    {
      key: 'email',
      header: t('table.email'),
      render: (user) => user.email,
    },
    {
      key: 'department',
      header: t('table.department'),
      render: (user) => user.department?.name,
      sortable: true,
    },
    {
      key: 'position',
      header: t('table.position'),
      render: (user) => user.position?.name,
      sortable: true,
    },
  ];

  return (
    <div>
      <TableToolbar
        search={search}
        onSearch={setSearch}
        action={
          isAdmin
            ? { label: t('createButton'), onClick: () => setModal({ type: 'create' }) }
            : undefined
        }
      />

      <DataTable<UserListFieldsFragment>
        rows={shown?.users.items ?? []}
        getRowId={(user) => user.id}
        columns={usersColumns}
        caption={t('title')}
        emptyMessage={t('table.empty')}
        getRowLabel={getFullName}
        sort={sort}
        onSortChange={setSort}
        onRetry={() => refetch()}
        error={error && errorMessage(parseError(error))}
        isLoading={loading && !shown}
        isRefreshing={loading && !!shown}
        onRowClick={isAdmin ? undefined : openUser}
        rowActions={
          isAdmin
            ? (user) => [
                { label: t('table.actions.view'), onSelect: openUser },
                {
                  label: t('table.actions.update'),
                  onSelect: () => setModal({ type: 'update', user }),
                },
                ...(user.id === currentUser?.id
                  ? []
                  : [
                      {
                        label: t('table.actions.delete'),
                        onSelect: () => setModal({ type: 'delete', user }),
                      },
                    ]),
              ]
            : undefined
        }
      />

      <Pagination
        page={page}
        pageSize={pageSize}
        total={shown?.users.total ?? 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {isAdmin && (
        <UserFormModal
          open={modal?.type === 'create' || modal?.type === 'update'}
          onOpenChange={(open) => !open && setModal(null)}
          user={modal?.type === 'update' ? modal.user : undefined}
          isSelf={modal?.type === 'update' && modal.user.id === currentUser?.id}
        />
      )}
      {isAdmin && (
        <ConfirmDialog
          open={!!userToDelete}
          onOpenChange={(open) => !open && setModal(null)}
          title={t('delete.title')}
          message={t.rich('delete.message', {
            name: userToDelete ? getFullName(userToDelete) : '',
            b: (chunks) => <strong>{chunks}</strong>,
          })}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
};
