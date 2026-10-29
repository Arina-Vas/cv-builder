import type { Prisma, ProjectRole as ProjectRoleEntity } from '@/generated/prisma/client';
import type { ProjectRole } from '@/projects/models/project-role.model';
import type { Project } from '@/projects/models/project.model';
import { skillInclude, toSkill } from '@/skills/skill.mapper';

export const projectInclude = {
  technologies: { include: { skill: { include: skillInclude } } },
} satisfies Prisma.ProjectInclude;
export type ProjectWithTechnologies = Prisma.ProjectGetPayload<{ include: typeof projectInclude }>;

export const toProjectRole = (row: ProjectRoleEntity): ProjectRole => ({
  name: row.name,
  id: row.id,
});

export const toProject = (row: ProjectWithTechnologies): Project => ({
  name: row.name,
  id: row.id,
  domain: row.domain,
  startDate: row.startDate,
  technologies: row.technologies.map((projectSkill) => toSkill(projectSkill.skill)),
  endDate: row.endDate,
  description: row.description,
});
