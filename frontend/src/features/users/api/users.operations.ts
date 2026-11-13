import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';

graphql(`
  fragment UserListFields on User {
    id
    email
    firstName
    lastName
    avatarUrl
    role
    department {
      id
      name
    }
    position {
      id
      name
    }
  }
`);

export const USERS = graphql(`
  query Users(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: UserSortField
    $sortOrder: SortOrder!
  ) {
    users(
      page: $page
      pageSize: $pageSize
      sortBy: $sortBy
      sortOrder: $sortOrder
      search: $search
    ) {
      items {
        ...UserListFields
      }
      page
      pageSize
      total
    }
  }
`);

export const USER = graphql(`
  query User($id: ID!) {
    user(id: $id) {
      ...UserListFields
      createdAt
      emailVerifiedAt
    }
  }
`);

export const USER_FORM_OPTIONS = graphql(`
  query UserFormOptions {
    departments(pageSize: 50) {
      items {
        id
        name
      }
    }
    positions(pageSize: 50) {
      items {
        id
        name
      }
    }
  }
`);

export const CREATE_USER = graphql(`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      ...UserListFields
    }
  }
`);

export const UPDATE_USER = graphql(`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      ...UserListFields
    }
  }
`);

export const UPDATE_PROFILE = graphql(`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      ...UserListFields
      createdAt
      emailVerifiedAt
    }
  }
`);

export const UPLOAD_AVATAR = graphql(`
  mutation UploadAvatar($userId: ID!, $file: Upload!) {
    uploadAvatar(userId: $userId, file: $file) {
      id
      avatarUrl
    }
  }
`);

export const REMOVE_AVATAR = graphql(`
  mutation RemoveAvatar($userId: ID!) {
    removeAvatar(userId: $userId) {
      id
      avatarUrl
    }
  }
`);

export const DELETE_USER = graphql(`
  mutation DeleteUser($id: ID!) {
    deleteUser(id: $id)
  }
`);

export const USER_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  refetchQueries: [USERS],
  awaitRefetchQueries: true,
};
