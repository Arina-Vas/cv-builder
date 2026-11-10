import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ApolloCache } from '@apollo/client';

graphql(`
  fragment SkillFields on Skill {
    id
    name
    category {
      id
      name
      type
    }
  }
`);

export const SKILLS = graphql(`
  query Skills(
    $page: Int!
    $pageSize: Int!
    $search: String
    $sortBy: SkillSortField!
    $sortOrder: SortOrder!
  ) {
    skills(
      page: $page
      pageSize: $pageSize
      search: $search
      sortBy: $sortBy
      sortOrder: $sortOrder
    ) {
      items {
        ...SkillFields
      }
      page
      pageSize
      total
    }
  }
`);

export const SKILL_CATEGORIES = graphql(`
  query SkillCategories {
    skillCategories {
      id
      name
      type
    }
  }
`);

export const CREATE_SKILL = graphql(`
  mutation CreateSkill($input: CreateSkillInput!) {
    createSkill(input: $input) {
      ...SkillFields
    }
  }
`);

export const UPDATE_SKILL = graphql(`
  mutation UpdateSkill($input: UpdateSkillInput!) {
    updateSkill(input: $input) {
      ...SkillFields
    }
  }
`);

export const DELETE_SKILL = graphql(`
  mutation DeleteSkill($id: ID!) {
    deleteSkill(id: $id)
  }
`);

/** create / update / delete: the dialog shows the error, the list is refetched before it closes */
export const SKILL_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  update: (cache: ApolloCache) => {
    cache.evict({ id: 'ROOT_QUERY', fieldName: 'skills' });
    cache.gc();
  },
  refetchQueries: [SKILLS],
  awaitRefetchQueries: true,
};
