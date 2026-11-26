import { effectiveEndDate } from '@/cvs/cv-projects/effective-end-date';

const day = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const NOW = new Date('2026-11-26T10:00:00.000Z');

const cvProject = (endDate: string | null, projectEndDate: string) => ({
  endDate: endDate === null ? null : day(endDate),
  project: { endDate: day(projectEndDate) },
});

describe('effectiveEndDate', () => {
  it('returns the CV end date when it is set', () => {
    expect(effectiveEndDate(cvProject('2025-03-31', '2025-12-31'), NOW)).toEqual(day('2025-03-31'));
  });

  it('returns the project end date when the CV has none and the project has ended', () => {
    expect(effectiveEndDate(cvProject(null, '2026-06-30'), NOW)).toEqual(day('2026-06-30'));
  });

  it('treats a project that ended yesterday as finished', () => {
    expect(effectiveEndDate(cvProject(null, '2026-11-25'), NOW)).toEqual(day('2026-11-25'));
  });

  it('returns null ("Present") when the project ends today, at any time of the UTC day', () => {
    expect(effectiveEndDate(cvProject(null, '2026-11-26'), NOW)).toBeNull();
    expect(
      effectiveEndDate(cvProject(null, '2026-11-26'), new Date('2026-11-26T23:59:59.999Z')),
    ).toBeNull();
  });

  it('returns null ("Present") when the project is still running', () => {
    expect(effectiveEndDate(cvProject(null, '2027-12-31'), NOW)).toBeNull();
  });
});
