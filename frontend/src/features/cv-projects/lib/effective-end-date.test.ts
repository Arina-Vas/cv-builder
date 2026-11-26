import { describe, expect, it } from 'vitest';
import { effectiveEndDate } from './effective-end-date';

// local time: "today" is the user's calendar day
const NOW = new Date(2026, 10, 26, 10, 0);

const cvProject = (endDate: string | null, projectEndDate: string) => ({
  endDate,
  project: { endDate: projectEndDate },
});

describe('effectiveEndDate', () => {
  it('returns the CV end date when it is set', () => {
    expect(effectiveEndDate(cvProject('2025-03-31', '2025-12-31'), NOW)).toBe('2025-03-31');
  });

  it('returns the project end date when the CV has none and the project has ended', () => {
    expect(effectiveEndDate(cvProject(null, '2026-06-30'), NOW)).toBe('2026-06-30');
  });

  it('treats a project that ended yesterday as finished', () => {
    expect(effectiveEndDate(cvProject(null, '2026-11-25'), NOW)).toBe('2026-11-25');
  });

  it('returns null ("Till now") when the project ends today', () => {
    expect(effectiveEndDate(cvProject(null, '2026-11-26'), NOW)).toBeNull();
    expect(
      effectiveEndDate(cvProject(null, '2026-11-26'), new Date(2026, 10, 26, 23, 59)),
    ).toBeNull();
  });

  it('returns null ("Till now") when the project is still running', () => {
    expect(effectiveEndDate(cvProject(null, '2027-12-31'), NOW)).toBeNull();
  });
});
