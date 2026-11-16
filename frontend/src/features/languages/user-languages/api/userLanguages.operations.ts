import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ErrorCode } from '@/shared/lib/apollo/graphql-errors';

graphql(`
  fragment UserLanguageFields on UserLanguage {
    id
    language {
      id
      name
    }
    proficiency
  }
`);

export const USER_LANGUAGES = graphql(`
  query UserLanguages($userId: ID!) {
    userLanguages(userId: $userId) {
      ...UserLanguageFields
    }
  }
`);

export const AVAILABLE_USER_LANGUAGES = graphql(`
  query AvailableUserLanguages($userId: ID!) {
    availableUserLanguages(userId: $userId) {
      id
      name
    }
  }
`);

export const CREATE_USER_LANGUAGE = graphql(`
  mutation CreateUserLanguage($input: CreateUserLanguageInput!) {
    createUserLanguage(input: $input) {
      ...UserLanguageFields
    }
  }
`);

export const UPDATE_USER_LANGUAGE = graphql(`
  mutation UpdateUserLanguage($input: UpdateUserLanguageInput!) {
    updateUserLanguage(input: $input) {
      ...UserLanguageFields
    }
  }
`);

export const DELETE_USER_LANGUAGES = graphql(`
  mutation DeleteUserLanguages($ids: [ID!]!, $userId: ID!) {
    deleteUserLanguages(ids: $ids, userId: $userId)
  }
`);

export const USER_LANGUAGE_REFETCH_QUERIES = [USER_LANGUAGES, AVAILABLE_USER_LANGUAGES];
export const USER_LANGUAGE_REFETCH_ERROR_CODES: ErrorCode[] = ['CONFLICT', 'NOT_FOUND'];

/** add / update / remove: the dialog shows the error; both lists are refetched on success
 *  and, via useRefetchOnError, after CONFLICT / NOT_FOUND */
export const USER_LANGUAGE_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  refetchQueries: USER_LANGUAGE_REFETCH_QUERIES,
  awaitRefetchQueries: true,
};
