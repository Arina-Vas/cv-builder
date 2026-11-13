import type { UserListFieldsFragment } from '@/gql/graphql';

type UserName = Pick<UserListFieldsFragment, 'firstName' | 'lastName' | 'email'>;

/** "First Last", or the email when the user has no name yet */
export const getFullName = (user: UserName) =>
  [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;
