import { Proficiency, UserRole } from '@/common/graphql/enums';
import type { CvPreview } from '@/cvs/cv-preview/models/cv-preview.model';
import type { CvProject } from '@/cvs/cv-projects/models/cv-project.model';
import type { UserLanguage } from '@/languages/user-languages/models/user-language.model';
import type { Project } from '@/projects/models/project.model';
import type { SkillCategory } from '@/skills/models/skill-category.model';
import type { Skill } from '@/skills/models/skill.model';
import type { User } from '@/users/models/user.model';

/**
 * Test data for the CV PDF specs: `CvPreview` as `CvPreviewService.getPreview` returns it.
 * Every builder takes overrides for the fields a test cares about.
 */

const TIMESTAMP = new Date('2026-01-01T00:00:00.000Z');

/** A calendar date as Prisma returns it: UTC midnight */
export const calendarDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);

export const skillCategoryFixture = (name = 'Frontend'): SkillCategory => ({
  id: `category-${name}`,
  name,
  type: 'Technical',
});

export const skillFixture = (name: string, category = skillCategoryFixture()): Skill => ({
  id: `skill-${name}`,
  name,
  category,
});

export const userLanguageFixture = (name: string, proficiency: Proficiency): UserLanguage => ({
  id: `user-language-${name}`,
  proficiency,
  language: { id: `language-${name}`, name, iso: name.slice(0, 2).toLowerCase(), nativeName: name },
});

export const userFixture = (overrides: Partial<User> = {}): User => ({
  id: 'user-1',
  email: 'employee@cv-builder.local',
  firstName: 'Anna',
  lastName: 'Smith',
  avatarKey: null,
  role: UserRole.EMPLOYEE,
  position: { id: 'position-1', name: 'Software Engineer' },
  department: null,
  emailVerifiedAt: TIMESTAMP,
  createdAt: TIMESTAMP,
  ...overrides,
});

export const projectFixture = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'ShopWave',
  domain: 'E-commerce',
  description: 'Online marketplace',
  startDate: calendarDate('2021-01-01'),
  endDate: calendarDate('2025-12-31'),
  technologies: [skillFixture('TypeScript'), skillFixture('React')],
  ...overrides,
});

export const cvProjectFixture = (overrides: Partial<CvProject> = {}): CvProject => ({
  id: 'cv-project-1',
  startDate: calendarDate('2022-03-01'),
  endDate: calendarDate('2024-12-31'),
  responsibilities: 'Built the catalog\nReviewed code',
  roles: [
    { id: 'role-1', name: 'Frontend Developer' },
    { id: 'role-2', name: 'Team Lead' },
  ],
  project: projectFixture(),
  ...overrides,
});

export const cvPreviewFixture = (overrides: Partial<CvPreview> = {}): CvPreview => ({
  id: 'cv-1',
  name: 'Frontend Developer CV',
  education: 'BSUIR, Software Engineering',
  description: 'Five years of web development',
  user: userFixture(),
  languages: [
    userLanguageFixture('Russian', Proficiency.NATIVE),
    userLanguageFixture('English', Proficiency.B2),
  ],
  domains: ['E-commerce', 'Healthcare'],
  skillGroups: [
    {
      category: skillCategoryFixture(),
      skills: [
        { skill: skillFixture('React'), experienceYears: 4, lastUsedYear: 2026 },
        { skill: skillFixture('Next.js'), experienceYears: null, lastUsedYear: null },
      ],
    },
  ],
  projects: [cvProjectFixture()],
  ...overrides,
});
