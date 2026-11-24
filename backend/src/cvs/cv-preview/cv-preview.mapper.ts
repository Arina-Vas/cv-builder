import type { Prisma } from '@/generated/prisma/client';
import { toCv } from '@/cvs/cv.mapper';
import { cvProjectInclude, toCvProject } from '@/cvs/cv-projects/cv-project.mapper';
import { cvSkillInclude, ownerHasSkill } from '@/cvs/cv-skills/cv-skill.mapper';
import {
  userLanguageInclude,
  toUserLanguage,
} from '@/languages/user-languages/user-language.mapper';
import { toSkill, toSkillCategory } from '@/skills/skill.mapper';
import { userInclude } from '@/users/user.mapper';
import type { CvPreview } from './models/cv-preview.model';
import type { CvPreviewSkillGroup } from './models/cv-preview-skill-group.model';
import { distinctDomains, type ProjectPeriod, skillExperience } from './cv-preview.calculations';

export const cvPreviewInclude = (ownerId: string) =>
  ({
    user: {
      include: {
        ...userInclude,
        languages: {
          include: userLanguageInclude,
          orderBy: [{ language: { name: 'asc' } }, { id: 'asc' }],
        },
      },
    },
    skills: {
      where: ownerHasSkill(ownerId),
      include: cvSkillInclude,
      orderBy: [
        { skill: { category: { name: 'asc' } } },
        { skill: { name: 'asc' } },
        { id: 'asc' },
      ],
    },
    projects: {
      include: cvProjectInclude,
      orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
    },
  }) satisfies Prisma.CvInclude;

export type CvPreviewRow = Prisma.CvGetPayload<{ include: ReturnType<typeof cvPreviewInclude> }>;

export const toCvPreview = (row: CvPreviewRow, now: Date): CvPreview => {
  const periods: ProjectPeriod[] = row.projects.map((cvProject) => ({
    startDate: cvProject.startDate,
    endDate: cvProject.endDate,
    skillIds: cvProject.project.technologies.map((technology) => technology.skillId),
  }));

  // skills come sorted by category name, so a group is complete once the next category starts
  const skillGroups: CvPreviewSkillGroup[] = [];
  for (const cvSkill of row.skills) {
    const category = cvSkill.skill.category;
    let group = skillGroups.at(-1);
    if (group?.category.id !== category.id) {
      group = { category: toSkillCategory(category), skills: [] };
      skillGroups.push(group);
    }
    group.skills.push({
      skill: toSkill(cvSkill.skill),
      ...skillExperience(cvSkill.skillId, periods, now),
    });
  }

  return {
    ...toCv(row),
    languages: row.user.languages.map(toUserLanguage),
    domains: distinctDomains(row.projects.map((cvProject) => cvProject.project.domain)),
    skillGroups,
    projects: row.projects.map(toCvProject),
  };
};
