const startOfUtcDay = (now: Date) =>
  new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

export const effectiveEndDate = (
  cvProject: {
    endDate: Date | null;
    project: { endDate: Date };
  },
  now: Date,
): Date | null => {
  if (cvProject.endDate) return cvProject.endDate;
  return cvProject.project.endDate < startOfUtcDay(now) ? cvProject.project.endDate : null;
};

export const compareEndDates = (a: Date | null, b: Date | null): number => {
  if (a === null || b === null) return (a === null ? 1 : 0) - (b === null ? 1 : 0);
  return a.getTime() - b.getTime();
};
