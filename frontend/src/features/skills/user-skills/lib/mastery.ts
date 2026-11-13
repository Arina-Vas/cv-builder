import type { Mastery } from '@/gql/graphql';
import type { LevelType } from '@/shared/components/level-bar/LevelBar.types';

export const MASTERY_LEVEL: Record<Mastery, LevelType> = {
  BEGINNER: 1,
  ELEMENTARY: 2,
  INTERMEDIATE: 3,
  ADVANCED: 4,
  EXPERT: 5,
};

export const MASTERIES = Object.keys(MASTERY_LEVEL) as Mastery[];
