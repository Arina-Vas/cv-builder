import { graphql } from '@/gql';

export const BREADCRUMB_USER = graphql(`
  query BreadcrumbUser($id: ID!) {
    user(id: $id) {
      id
      email
      firstName
      lastName
    }
  }
`);
