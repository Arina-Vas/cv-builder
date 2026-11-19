import type { Prisma } from '@/generated/prisma/client';
import type { CvProject } from '@/cvs/cv-projects/models/cv-project.model';
import { projectInclude, toProject, toProjectRole } from '@/projects/project.mapper';

export const cvProjectInclude = {
  project: { include: projectInclude },
  roles: {
    include: { role: true },
    orderBy: { role: { name: 'asc' } },
  },
} satisfies Prisma.CvProjectInclude;
export type CvProjectWithRelations = Prisma.CvProjectGetPayload<{
  include: typeof cvProjectInclude;
}>;

export const toCvProject = (row: CvProjectWithRelations): CvProject => ({
  id: row.id,
  project: toProject(row.project),
  startDate: row.startDate,
  endDate: row.endDate,
  roles: row.roles.map((cvProjectRole) => toProjectRole(cvProjectRole.role)),
  responsibilities: row.responsibilities,
});
