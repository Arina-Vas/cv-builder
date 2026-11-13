import { describe, expect, it } from 'vitest';
import { MASTERIES, MASTERY_LEVEL } from '@/features/skills/user-skills/lib/mastery';

describe('mastery', () => {
  // LevelBar README → Levels
  it.each([
    ['BEGINNER', 1],
    ['ELEMENTARY', 2],
    ['INTERMEDIATE', 3],
    ['ADVANCED', 4],
    ['EXPERT', 5],
  ] as const)('shows %s as level %i', (mastery, level) => {
    expect(MASTERY_LEVEL[mastery]).toBe(level);
  });

  it('lists the options from Beginner to Expert', () => {
    expect(MASTERIES).toEqual(['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'ADVANCED', 'EXPERT']);
  });
});
