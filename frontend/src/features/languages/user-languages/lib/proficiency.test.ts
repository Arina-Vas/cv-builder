import { describe, expect, it } from 'vitest';
import { PROFICIENCIES, PROFICIENCY_LEVEL } from './proficiency';

describe('proficiency', () => {
  // LevelBar README → Levels
  it.each([
    ['A1', 1],
    ['A2', 1],
    ['B1', 2],
    ['B2', 3],
    ['C1', 4],
    ['C2', 4],
    ['NATIVE', 5],
  ] as const)('shows %s as level %i', (proficiency, level) => {
    expect(PROFICIENCY_LEVEL[proficiency]).toBe(level);
  });

  it('lists the options from A1 to Native', () => {
    expect(PROFICIENCIES).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'NATIVE']);
  });
});
