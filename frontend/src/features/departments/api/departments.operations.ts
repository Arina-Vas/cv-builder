import { graphql } from '@/gql';

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
