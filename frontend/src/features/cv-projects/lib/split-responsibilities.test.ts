import { describe, expect, it } from 'vitest';
import { splitResponsibilities } from './split-responsibilities';

describe('splitResponsibilities', () => {
  it('splits by new line', () => {
    expect(splitResponsibilities('Code review\nMentoring')).toEqual(['Code review', 'Mentoring']);
  });

  it('splits by comma too, as the form hint says', () => {
    expect(splitResponsibilities('Code review, Mentoring')).toEqual(['Code review', 'Mentoring']);
  });

  it('mixes both separators and Windows line endings', () => {
    expect(splitResponsibilities('Code review,Mentoring\r\nTesting')).toEqual([
      'Code review',
      'Mentoring',
      'Testing',
    ]);
  });

  it('trims every item and drops the empty ones', () => {
    expect(splitResponsibilities('  Code review ,\n\n , Mentoring  ,')).toEqual([
      'Code review',
      'Mentoring',
    ]);
  });

  it.each([null, undefined, '', '   ', ',\n,'])('gives no items for %j', (text) => {
    expect(splitResponsibilities(text)).toEqual([]);
  });
});
