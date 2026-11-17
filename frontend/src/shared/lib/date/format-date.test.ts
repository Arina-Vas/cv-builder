import { describe, expect, it } from 'vitest';
import { formatDate } from './format-date';

describe('formatDate', () => {
  it('formats a Date as MM/dd/yyyy', () => {
    expect(formatDate(new Date(2025, 8, 4))).toBe('09/04/2025');
  });

  it('formats a Date-scalar string (yyyy-MM-dd) as MM/dd/yyyy', () => {
    expect(formatDate('2024-03-01')).toBe('03/01/2024');
    expect(formatDate('2024-12-31')).toBe('12/31/2024');
  });

  it('keeps the calendar day of a yyyy-MM-dd string (parsed as local midnight, not UTC)', () => {
    expect(formatDate('2024-01-01')).toBe('01/01/2024');
  });
});
