export type ProjectPeriod = {
  startDate: Date;
  endDate: Date | null;
  skillIds: string[];
};

export type SkillExperience = {
  experienceYears: number | null;
  lastUsedYear: number | null;
};

export const fullYearsBetween = (from: Date, to: Date): number => {
  let years = to.getUTCFullYear() - from.getUTCFullYear();

  const monthDiff = to.getUTCMonth() - from.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && to.getUTCDate() < from.getUTCDate())) {
    years -= 1;
  }

  return Math.max(0, years);
};

export const skillExperience = (
  skillId: string,
  projects: ProjectPeriod[],
  now: Date,
): SkillExperience => {
  const matching = projects.filter((project) => project.skillIds.includes(skillId));
  if (matching.length === 0) return { experienceYears: null, lastUsedYear: null };

  const earliestStart = Math.min(...matching.map((project) => project.startDate.getTime()));

  const endYears = matching.flatMap((project) =>
    project.endDate ? [project.endDate.getUTCFullYear()] : [],
  );

  // fewer end years than projects: one of them has no end date ("Till now"), so the skill is used now
  const lastUsedYear =
    endYears.length < matching.length ? now.getUTCFullYear() : Math.max(...endYears);

  return {
    experienceYears: fullYearsBetween(new Date(earliestStart), now),
    lastUsedYear,
  };
};

// different projects can share a domain: it is free text of the catalog project, not unique
export const distinctDomains = (domains: string[]): string[] =>
  [...new Set(domains)].sort((a, b) => a.localeCompare(b));
