import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';

graphql(`
  fragment LanguageFields on Language {
    id
    name
    iso
    nativeName
  }
`);

export const LANGUAGES = graphql(`
  query Languages(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: LanguageSortField!
    $sortOrder: SortOrder!
  ) {
    languages(
      page: $page
      pageSize: $pageSize
      search: $search
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      items {
        ...LanguageFields
      }
      page
      pageSize
      total
    }
  }
`);

export const CREATE_LANGUAGE = graphql(`
  mutation CreateLanguage($input: CreateLanguageInput!) {
    createLanguage(input: $input) {
      ...LanguageFields
    }
  }
`);

export const UPDATE_LANGUAGE = graphql(`
  mutation UpdateLanguage($input: UpdateLanguageInput!) {
    updateLanguage(input: $input) {
      ...LanguageFields
    }
  }
`);

export const DELETE_LANGUAGE = graphql(`
  mutation DeleteLanguage($id: ID!) {
    deleteLanguage(id: $id)
  }
`);

/** create / update / delete: the dialog shows the error, the list is refetched before it closes */
export const LANGUAGE_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  refetchQueries: [LANGUAGES],
  awaitRefetchQueries: true,
};
