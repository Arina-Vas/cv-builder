import { graphql } from '@/gql';
import type { ApolloCache } from '@apollo/client';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';

graphql(`
  fragment ProjectFields on Project {
    id
    name
    description
    domain
    startDate
    endDate
    technologies {
      id
      name
    }
  }
`);

export const PROJECTS = graphql(`
  query Projects($search: String, $sortBy: ProjectSortField!, $sortOrder: SortOrder!) {
    projects(search: $search, sortBy: $sortBy, sortOrder: $sortOrder) {
      items {
        ...ProjectFields
      }
      total
    }
  }
`);

export const TECHNOLOGIES = graphql(`
  query Technologies {
    technologies {
      id
      name
    }
  }
`);

export const CREATE_PROJECT = graphql(`
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      ...ProjectFields
    }
  }
`);

export const UPDATE_PROJECT = graphql(`
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      ...ProjectFields
    }
  }
`);

export const DELETE_PROJECT = graphql(`
  mutation DeleteProject($id: ID!) {
    deleteProject(id: $id)
  }
`);

/** create / update / delete: the dialog shows the error, the list is refetched before it closes */
export const PROJECT_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  update: (cache: ApolloCache) => {
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'projects' });
    cache.gc();
  },
  refetchQueries: [PROJECTS],
  awaitRefetchQueries: true,
};
