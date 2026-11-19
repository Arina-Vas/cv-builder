import { type Column, DataTable, TableToolbar } from '@/shared/components/table';
import type { CvFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { Pagination } from '@/shared/components/pagination';
import { useCvList } from '@/features/cvs/lib/hooks/useCvList';
import { notFound } from 'next/navigation';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';

type Props = {
  userId?: string;
};

export const Cvs = ({ userId }: Props) => {
  const t = useTranslations('cvs');
  const { user } = useCurrentUser();

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

  if (isUserNotFound) notFound();

  return (
    <div>
      <TableToolbar search={search} onSearch={setSearch} />
      <DataTable<CvFieldsFragment>
        {...tableState}
        rows={rows}
        getRowId={(cv) => cv.id}
        columns={cvsColumns}
        caption={t('title')}
        emptyMessage={user?.role !== 'ADMIN' && !search ? t('table.userEmpty') : t('table.empty')}
        getRowLabel={(cv) => cv.name}
        onSortChange={setSort}
        sort={sort}
        renderRowDetails={(cv) => <p>{cv.description}</p>}
      />
      <Pagination {...pagination} />
    </div>
  );
};
