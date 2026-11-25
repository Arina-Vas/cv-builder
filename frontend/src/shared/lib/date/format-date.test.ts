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

  it('uses MM/dd/yyyy when the format is passed explicitly', () => {
    expect(formatDate('2024-03-01', 'MM/dd/yyyy')).toBe('03/01/2024');
  });

  describe('MM.yyyy (CV preview project period)', () => {
    it('formats a Date-scalar string as month.year', () => {
      expect(formatDate('2023-08-01', 'MM.yyyy')).toBe('08.2023');
    });

    it('formats a Date as month.year', () => {
      expect(formatDate(new Date(2025, 8, 4), 'MM.yyyy')).toBe('09.2025');
    });

    it('keeps the month and year at the edges of a month and a year', () => {
      expect(formatDate('2024-01-01', 'MM.yyyy')).toBe('01.2024');
      expect(formatDate('2024-12-31', 'MM.yyyy')).toBe('12.2024');
    });

    // `YYYY` in date-fns is the ISO week-numbering year: 2024-12-30 is in week 1 of 2025
    it('uses the calendar year, not the week-numbering year', () => {
      expect(formatDate('2024-12-30', 'MM.yyyy')).toBe('12.2024');
    });
  });
});
