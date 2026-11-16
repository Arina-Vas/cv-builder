import { graphql } from '@/gql';

export const CHANGE_PASSWORD = graphql(`
  mutation ChangePassword($input: ChangePasswordInput!) {
    changePassword(input: $input)
  }
`);
