import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ApolloCache } from '@apollo/client';

graphql(`
  fragment DepartmentFields on Department {
    id
    name
  }
`);

export const DEPARTMENTS = graphql(`
  query Departments(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: DepartmentSortField!
    $sortOrder: SortOrder!
  ) {
    departments(
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortOrder: $sortOrder
      search: $search
    ) {
      items {
        ...DepartmentFields
      }
      page
      pageSize
      total
    }
  }
`);

export const CREATE_DEPARTMENT = graphql(`
  mutation CreateDepartment($input: CreateDepartmentInput!) {
    createDepartment(input: $input) {
      ...DepartmentFields
    }
  }
`);

export const UPDATE_DEPARTMENT = graphql(`
  mutation UpdateDepartment($input: UpdateDepartmentInput!) {
    updateDepartment(input: $input) {
      ...DepartmentFields
    }
  }
`);

export const DELETE_DEPARTMENT = graphql(`
  mutation DeleteDepartment($id: ID!) {
    deleteDepartment(id: $id)
  }
`);

/** create / update / delete: the dialog shows the error, the list is refetched before it closes */
export const DEPARTMENT_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  update: (cache: ApolloCache) => {
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'departments' });
    cache.gc();
  },
  refetchQueries: [DEPARTMENTS],
  awaitRefetchQueries: true,
};
