import type { Proficiency } from '@/gql/graphql';
import type { LevelType } from '@/shared/components/level-bar/LevelBar.types';

export const PROFICIENCY_LEVEL: Record<Proficiency, LevelType> = {
  A1: 1,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 4,
  NATIVE: 5,
};

export const PROFICIENCIES = Object.keys(PROFICIENCY_LEVEL) as Proficiency[];
