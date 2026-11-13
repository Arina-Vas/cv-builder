import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ApolloCache } from '@apollo/client';

graphql(`
  fragment PositionFields on Position {
    id
    name
  }
`);

export const POSITIONS = graphql(`
  query Positions(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: PositionSortField!
    $sortOrder: SortOrder!
  ) {
    positions(
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortOrder: $sortOrder
      search: $search
    ) {
      items {
        ...PositionFields
      }
      page
      pageSize
      total
    }
  }
`);

export const CREATE_POSITION = graphql(`
  mutation CreatePosition($input: CreatePositionInput!) {
    createPosition(input: $input) {
      ...PositionFields
    }
  }
`);

export const UPDATE_POSITION = graphql(`
  mutation UpdatePosition($input: UpdatePositionInput!) {
    updatePosition(input: $input) {
      ...PositionFields
    }
  }
`);

export const DELETE_POSITION = graphql(`
  mutation DeletePosition($id: ID!) {
    deletePosition(id: $id)
  }
`);

/** create / update / delete: the dialog shows the error, the list is refetched before it closes */
export const POSITION_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  update: (cache: ApolloCache) => {
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'positions' });
    cache.gc();
  },
  refetchQueries: [POSITIONS],
  awaitRefetchQueries: true,
};
