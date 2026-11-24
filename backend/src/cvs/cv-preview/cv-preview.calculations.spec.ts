import {
  distinctDomains,
  fullYearsBetween,
  type ProjectPeriod,
  skillExperience,
} from '@/cvs/cv-preview/cv-preview.calculations';

// Calendar day as Prisma returns a @db.Date value: UTC midnight
const day = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

const NOW = day('2026-11-24');

const project = (startDate: string, endDate: string | null, skillIds: string[]): ProjectPeriod => ({
  startDate: day(startDate),
  endDate: endDate === null ? null : day(endDate),
  skillIds,
});

describe('fullYearsBetween', () => {
  it.each([
    ['a later month', '2023-06-01', 3],
    ['the same day', '2023-11-24', 3],
    ['the next day', '2023-11-25', 2],
    ['a later day of the same month', '2023-11-30', 2],
    ['an earlier month', '2023-12-01', 2],
    ['less than a year', '2026-01-01', 0],
    ['the same date', '2026-11-24', 0],
    ['a date in the future', '2027-03-01', 0],
  ])('counts full years from %s', (_case, from, years) => {
    expect(fullYearsBetween(day(from), NOW)).toBe(years);
  });

  it('counts 29 February as a full year only after 28 February has passed', () => {
    expect(fullYearsBetween(day('2024-02-29'), day('2025-02-28'))).toBe(0);
    expect(fullYearsBetween(day('2024-02-29'), day('2025-03-01'))).toBe(1);
  });

  it('reads the UTC date, so a server time zone does not move the day', () => {
    // 23:30 UTC on 23 November: the day before in UTC, the next day in UTC+1
    expect(fullYearsBetween(day('2023-11-24'), new Date('2026-11-23T23:30:00.000Z'))).toBe(2);
  });
});

describe('skillExperience', () => {
  it('returns null for both values when no CV project uses the skill', () => {
    const projects = [project('2022-03-01', '2023-12-31', ['react'])];

    expect(skillExperience('angular', projects, NOW)).toEqual({
      experienceYears: null,
      lastUsedYear: null,
    });
  });

  it('returns null for both values for a CV without projects', () => {
    expect(skillExperience('react', [], NOW)).toEqual({
      experienceYears: null,
      lastUsedYear: null,
    });
  });

  it('counts experience from the earliest start and does not sum overlapping periods', () => {
    const projects = [
      project('2023-06-01', '2024-06-01', ['react']),
      project('2022-03-01', '2023-12-31', ['react']),
      project('2022-09-01', '2023-03-01', ['react']),
    ];

    expect(skillExperience('react', projects, NOW).experienceYears).toBe(4);
  });

  it('gives 0 years for a skill used for less than a year', () => {
    const projects = [project('2026-02-01', null, ['react'])];

    expect(skillExperience('react', projects, NOW)).toEqual({
      experienceYears: 0,
      lastUsedYear: 2026,
    });
  });

  it('takes the end year of the latest finished project', () => {
    const projects = [
      project('2020-01-01', '2025-06-30', ['react']),
      project('2021-01-01', '2023-12-31', ['react']),
    ];

    expect(skillExperience('react', projects, NOW).lastUsedYear).toBe(2025);
  });

  it('takes the current year when a matching project is "Till now"', () => {
    const projects = [
      project('2020-01-01', '2025-06-30', ['react']),
      project('2019-01-01', null, ['react']),
    ];

    expect(skillExperience('react', projects, NOW).lastUsedYear).toBe(2026);
  });

  it('ignores projects that do not use the skill', () => {
    const projects = [
      project('2015-01-01', null, ['angular']),
      project('2022-03-01', '2023-12-31', ['react']),
    ];

    expect(skillExperience('react', projects, NOW)).toEqual({
      experienceYears: 4,
      lastUsedYear: 2023,
    });
  });

  it('matches the example in docs/data-model.md', () => {
    const projects = [
      project('2022-03-01', '2023-12-31', ['react', 'javascript']),
      project('2023-06-01', null, ['typescript', 'react']),
    ];
    const result = (skillId: string) => skillExperience(skillId, projects, NOW);

    expect(result('react')).toEqual({ experienceYears: 4, lastUsedYear: 2026 });
    expect(result('javascript')).toEqual({ experienceYears: 4, lastUsedYear: 2023 });
    expect(result('typescript')).toEqual({ experienceYears: 3, lastUsedYear: 2026 });
    expect(result('angular')).toEqual({ experienceYears: null, lastUsedYear: null });
  });
});

describe('distinctDomains', () => {
  it('keeps each domain once, sorted alphabetically', () => {
    expect(distinctDomains(['FinTech', 'E-commerce', 'Healthcare', 'E-commerce'])).toEqual([
      'E-commerce',
      'FinTech',
      'Healthcare',
    ]);
  });

  it('returns an empty list for a CV without projects', () => {
    expect(distinctDomains([])).toEqual([]);
  });
});
