import { graphql } from '@/gql';
import type { ApolloCache } from '@apollo/client';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ErrorCode } from '@/shared/lib/apollo/graphql-errors';

graphql(`
  fragment CvProjectFields on CvProject {
    id
    startDate
    endDate
    responsibilities
    roles {
      id
      name
    }
    project {
      ...ProjectFields
    }
  }
`);

export const CV_PROJECTS = graphql(`
  query CvProjects(
    $cvId: ID!
    $search: String
    $sortBy: CvProjectSortField!
    $sortOrder: SortOrder!
  ) {
    cvProjects(cvId: $cvId, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {
      items {
        ...CvProjectFields
      }
      total
    }
  }
`);

export const AVAILABLE_CV_PROJECTS = graphql(`
  query AvailableCvProjects($cvId: ID!) {
    availableCvProjects(cvId: $cvId) {
      ...ProjectFields
    }
  }
`);

export const PROJECT_ROLES = graphql(`
  query ProjectRoles {
    projectRoles {
      id
      name
    }
  }
`);

export const CREATE_CV_PROJECT = graphql(`
  mutation CreateCvProject($input: CreateCvProjectInput!) {
    createCvProject(input: $input) {
      ...CvProjectFields
    }
  }
`);

export const UPDATE_CV_PROJECT = graphql(`
  mutation UpdateCvProject($input: UpdateCvProjectInput!) {
    updateCvProject(input: $input) {
      ...CvProjectFields
    }
  }
`);

export const DELETE_CV_PROJECT = graphql(`
  mutation DeleteCvProject($id: ID!, $cvId: ID!) {
    deleteCvProject(id: $id, cvId: $cvId)
  }
`);

export const CV_PROJECT_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  update: (cache: ApolloCache) => {
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'cvProjects' });
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'availableCvProjects' });
    cache.gc();
  },
  refetchQueries: [CV_PROJECTS],
  awaitRefetchQueries: true,
};

export const CV_PROJECT_REFETCH_QUERIES = [CV_PROJECTS, AVAILABLE_CV_PROJECTS];
export const CV_PROJECT_REFETCH_ERROR_CODES: ErrorCode[] = ['CONFLICT', 'NOT_FOUND'];
