import { useTableParams } from '@/shared/hooks/useTableParams';
import { skipToken, useQuery } from '@apollo/client/react';
import { CVS, USER_CVS } from '@/features/cvs/api/cvs.operations';
import { usePagination } from '@/shared/components/pagination';
import { hasErrorCode, parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { type CvSortField } from '@/gql/graphql';

export const useCvList = (userId?: string) => {
  const tableParams = useTableParams<CvSortField>({
    sortFields: ['name'],
    defaultSort: { field: 'name', order: 'ASC' },
  });
  const { search, sort, page, pageSize } = tableParams;

  const errorMessage = useErrorMessage();

  const variables = { search, sortBy: sort.field, sortOrder: sort.order, page, pageSize };

  const all = useQuery(CVS, userId ? skipToken : { variables });

  const byUser = useQuery(USER_CVS, userId ? { variables: { ...variables, userId } } : skipToken);

  const result = userId ? byUser : all;
  const fresh = userId ? byUser.data?.userCvs : all.data?.cvs;
  const shown = fresh ?? (userId ? byUser.previousData?.userCvs : all.previousData?.cvs);

  const pagination = usePagination(tableParams, { total: shown?.total, freshTotal: fresh?.total });

  return {
    tableParams,
    pagination,
    rows: shown?.items ?? [],
    isUserNotFound: hasErrorCode(result.error, 'NOT_FOUND'),
    tableState: {
      isLoading: result.loading && !shown,
      isRefreshing: result.loading && !!shown,
      error: result.error && errorMessage(parseError(result.error)),
      onRetry: () => void result.refetch(),
    },
  };
};
