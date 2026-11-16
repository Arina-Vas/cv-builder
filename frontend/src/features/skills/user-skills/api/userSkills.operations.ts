import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ErrorCode } from '@/shared/lib/apollo/graphql-errors';

graphql(`
  fragment UserSkillFields on UserSkill {
    id
    skill {
      id
      name
      category {
        id
        name
      }
    }
    mastery
  }
`);

export const USER_SKILLS = graphql(`
  query UserSkills($userId: ID!) {
    userSkills(userId: $userId) {
      ...UserSkillFields
    }
  }
`);

export const AVAILABLE_USER_SKILLS = graphql(`
  query AvailableUserSkills($userId: ID!) {
    availableUserSkills(userId: $userId) {
      id
      name
    }
  }
`);

export const CREATE_USER_SKILL = graphql(`
  mutation CreateUserSkill($input: CreateUserSkillInput!) {
    createUserSkill(input: $input) {
      ...UserSkillFields
    }
  }
`);

export const UPDATE_USER_SKILL = graphql(`
  mutation UpdateUserSkill($input: UpdateUserSkillInput!) {
    updateUserSkill(input: $input) {
      ...UserSkillFields
    }
  }
`);

export const DELETE_USER_SKILLS = graphql(`
  mutation DeleteUserSkills($ids: [ID!]!, $userId: ID!) {
    deleteUserSkills(ids: $ids, userId: $userId)
  }
`);

export const USER_SKILL_REFETCH_QUERIES = [USER_SKILLS, AVAILABLE_USER_SKILLS];
export const USER_SKILL_REFETCH_ERROR_CODES: ErrorCode[] = ['CONFLICT', 'NOT_FOUND'];

/** add / update / remove: the dialog shows the error; both lists are refetched on success
 *  and, via useRefetchOnError, after CONFLICT / NOT_FOUND */
export const USER_SKILL_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  refetchQueries: USER_SKILL_REFETCH_QUERIES,
  awaitRefetchQueries: true,
};
