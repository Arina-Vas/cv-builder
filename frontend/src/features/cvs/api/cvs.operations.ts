import { graphql } from '@/gql';
import type { ApolloCache } from '@apollo/client';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';

graphql(`
  fragment CvFields on Cv {
    id
    name
    description
    education
    user {
      id
      email
    }
  }
`);

export const CVS = graphql(`
  query Cvs(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: CvSortField!
    $sortOrder: SortOrder!
  ) {
    cvs(page: $page, pageSize: $pageSize, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {
      items {
        ...CvFields
      }
      page
      pageSize
      total
    }
  }
`);

export const CV_PREVIEW = graphql(`
  query CvPreview($id: ID!) {
    cvPreview(id: $id) {
      id
      name
      education
      description
      domains
      user {
        id
        email
        firstName
        lastName
        position {
          id
          name
        }
      }
      languages {
        id
        proficiency
        language {
          id
          name
        }
      }
      skillGroups {
        category {
          id
          name
        }
        skills {
          experienceYears
          lastUsedYear
          skill {
            id
            name
          }
        }
      }
      projects {
        ...CvProjectFields
      }
    }
  }
`);

export const USER_CVS = graphql(`
  query UserCvs(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: CvSortField!
    $sortOrder: SortOrder!
    $userId: ID!
  ) {
    userCvs(
      page: $page
      pageSize: $pageSize
      search: $search
      sortBy: $sortBy
      sortOrder: $sortOrder
      userId: $userId
    ) {
      items {
        ...CvFields
      }
      page
      pageSize
      total
    }
  }
`);

export const CV = graphql(`
  query Cv($id: ID!) {
    cv(id: $id) {
      ...CvFields
    }
  }
`);

export const CREATE_CV = graphql(`
  mutation CreateCv($input: CreateCvInput!) {
    createCv(input: $input) {
      ...CvFields
    }
  }
`);

export const UPDATE_CV = graphql(`
  mutation UpdateCv($input: UpdateCvInput!) {
    updateCv(input: $input) {
      ...CvFields
    }
  }
`);

export const DELETE_CV = graphql(`
  mutation DeleteCv($id: ID!, $userId: ID!) {
    deleteCv(id: $id, userId: $userId)
  }
`);

/** create / update / delete: the dialog shows the error, the list is refetched before it closes */
export const CV_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  update: (cache: ApolloCache) => {
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'cvs' });
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'userCvs' });
    cache.gc();
  },
  refetchQueries: [CVS, USER_CVS],
  awaitRefetchQueries: true,
};
