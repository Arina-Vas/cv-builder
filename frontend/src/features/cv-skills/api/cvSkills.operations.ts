import { graphql } from '@/gql';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import type { ErrorCode } from '@/shared/lib/apollo/graphql-errors';

graphql(`
  fragment CvSkillFields on CvSkill {
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

export const CV_SKILLS = graphql(`
  query CvSkills($cvId: ID!) {
    cvSkills(cvId: $cvId) {
      ...CvSkillFields
    }
  }
`);

export const AVAILABLE_CV_SKILLS = graphql(`
  query AvailableCvSkills($cvId: ID!) {
    availableCvSkills(cvId: $cvId) {
      id
      name
    }
  }
`);

export const CREATE_CV_SKILL = graphql(`
  mutation CreateCvSkill($input: CreateCvSkillInput!) {
    createCvSkill(input: $input) {
      ...CvSkillFields
    }
  }
`);

export const UPDATE_CV_SKILL = graphql(`
  mutation UpdateCvSkill($input: UpdateCvSkillInput!) {
    updateCvSkill(input: $input) {
      ...CvSkillFields
    }
  }
`);

export const DELETE_CV_SKILLS = graphql(`
  mutation DeleteCvSkills($cvId: ID!, $ids: [ID!]!) {
    deleteCvSkills(cvId: $cvId, ids: $ids)
  }
`);

export const CV_SKILL_REFETCH_QUERIES = [CV_SKILLS, AVAILABLE_CV_SKILLS];

export const CV_SKILL_REFETCH_ERROR_CODES: ErrorCode[] = [
  'CONFLICT',
  'BAD_USER_INPUT',
  'NOT_FOUND',
];

export const CV_SKILL_MUTATION_OPTIONS = {
  context: NO_ERROR_TOAST,
  refetchQueries: CV_SKILL_REFETCH_QUERIES,
  awaitRefetchQueries: true,
};
