import { describe, expect, it } from 'vitest';
import { formatMemberSinceDate } from './formatMemberSinceDate';

// Midday UTC, so the day is the same in every time zone the tests may run in
const CREATED_AT = '2024-01-14T12:00:00.000Z';

describe('formatMemberSinceDate', () => {
  it('formats like the Figma design: "Sun Jan 14 2024", without commas', () => {
    expect(formatMemberSinceDate(CREATED_AT, 'en')).toBe('Sun Jan 14 2024');
  });

  it('uses the words and order of the given locale', () => {
    const result = formatMemberSinceDate(CREATED_AT, 'de');

    expect(result).toContain('14');
    expect(result).toContain('2024');
    expect(result).toMatch(/^So/);
    expect(result).not.toContain(',');
  });
});
