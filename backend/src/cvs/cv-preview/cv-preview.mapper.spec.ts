import { Proficiency, UserRole } from '@/common/graphql/enums';
import { cvProjectInclude } from '@/cvs/cv-projects/cv-project.mapper';
import { cvSkillInclude, ownerHasSkill } from '@/cvs/cv-skills/cv-skill.mapper';
import {
  cvPreviewInclude,
  type CvPreviewRow,
  toCvPreview,
} from '@/cvs/cv-preview/cv-preview.mapper';

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const day = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const NOW = day('2026-11-24');

const FRONTEND = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' };
const LANGUAGES = { id: 'cat-Languages', name: 'Programming Languages', type: 'Languages' };

const skillRow = (name: string, category: typeof FRONTEND) => ({
  id: `skill-${name}`,
  name,
  categoryId: category.id,
  category: { ...category, ...TIMESTAMPS },
  ...TIMESTAMPS,
});

const cvSkillRow = (name: string, category: typeof FRONTEND) => ({
  id: `cv-skill-${name}`,
  cvId: 'cv-1',
  skillId: `skill-${name}`,
  skill: skillRow(name, category),
  ...TIMESTAMPS,
});

const cvProjectRow = (
  name: string,
  domain: string,
  startDate: string,
  endDate: string | null,
  technologies: ReturnType<typeof skillRow>[],
  projectEndDate = '2030-01-01',
) => ({
  id: `cv-project-${name}`,
  cvId: 'cv-1',
  projectId: `project-${name}`,
  startDate: day(startDate),
  endDate: endDate === null ? null : day(endDate),
  responsibilities: null,
  project: {
    id: `project-${name}`,
    name,
    domain,
    description: `${name} description`,
    startDate: day('2020-01-01'),
    endDate: day(projectEndDate),
    technologies: technologies.map((skill) => ({
      id: `link-${name}-${skill.name}`,
      projectId: `project-${name}`,
      skillId: skill.id,
      skill,
      ...TIMESTAMPS,
    })),
    ...TIMESTAMPS,
  },
  roles: [],
  ...TIMESTAMPS,
});

const REACT = skillRow('React', FRONTEND);
const JAVASCRIPT = skillRow('JavaScript', LANGUAGES);

// Only the fields the mapper reads; the full Prisma payload would also carry the password hash etc.
const row = (overrides: Partial<Record<keyof CvPreviewRow, unknown>> = {}): CvPreviewRow =>
  ({
    id: 'cv-1',
    name: 'Frontend CV',
    education: 'BSUIR',
    description: 'React developer',
    userId: 'owner-1',
    user: {
      id: 'owner-1',
      email: 'owner@example.com',
      firstName: 'Ann',
      lastName: 'Lee',
      avatarKey: null,
      role: UserRole.EMPLOYEE,
      emailVerifiedAt: null,
      createdAt: TIMESTAMPS.createdAt,
      department: null,
      position: { id: 'position-1', name: 'Software Engineer', ...TIMESTAMPS },
      languages: [
        {
          id: 'user-language-1',
          userId: 'owner-1',
          languageId: 'language-en',
          proficiency: Proficiency.C1,
          language: { id: 'language-en', name: 'English', iso: 'EN', nativeName: 'English' },
          ...TIMESTAMPS,
        },
      ],
    },
    // sorted by category name, then skill name, as cvPreviewInclude asks the database
    skills: [
      cvSkillRow('Angular', FRONTEND),
      cvSkillRow('React', FRONTEND),
      cvSkillRow('JavaScript', LANGUAGES),
    ],
    projects: [
      cvProjectRow('Shop B', 'E-commerce', '2023-06-01', null, [REACT]),
      cvProjectRow('Clinic', 'Healthcare', '2022-09-01', '2023-03-01', []),
      cvProjectRow('Shop A', 'E-commerce', '2022-03-01', '2023-12-31', [REACT, JAVASCRIPT]),
    ],
    ...TIMESTAMPS,
    ...overrides,
  }) as unknown as CvPreviewRow;

describe('cvPreviewInclude', () => {
  it("lists only CV skills the owner still has, the CV Skills tab's rule", () => {
    expect(cvPreviewInclude('owner-1').skills).toMatchObject({
      where: ownerHasSkill('owner-1'),
      include: cvSkillInclude,
    });
  });

  it('sorts languages by name, skills by category and name, projects by the latest start', () => {
    const include = cvPreviewInclude('owner-1');

    expect(include.user.include.languages.orderBy).toEqual([
      { language: { name: 'asc' } },
      { id: 'asc' },
    ]);
    expect(include.skills.orderBy).toEqual([
      { skill: { category: { name: 'asc' } } },
      { skill: { name: 'asc' } },
      { id: 'asc' },
    ]);
    expect(include.projects).toEqual({
      include: cvProjectInclude,
      orderBy: [{ startDate: 'desc' }, { id: 'asc' }],
    });
  });
});

describe('toCvPreview', () => {
  it('maps the CV, its owner and the owner languages', () => {
    expect(toCvPreview(row(), NOW)).toMatchObject({
      id: 'cv-1',
      name: 'Frontend CV',
      education: 'BSUIR',
      description: 'React developer',
      user: {
        id: 'owner-1',
        firstName: 'Ann',
        lastName: 'Lee',
        position: { id: 'position-1', name: 'Software Engineer' },
      },
      languages: [
        {
          id: 'user-language-1',
          proficiency: Proficiency.C1,
          language: { id: 'language-en', name: 'English', iso: 'EN', nativeName: 'English' },
        },
      ],
    });
  });

  it('lists every project domain once, sorted', () => {
    expect(toCvPreview(row(), NOW).domains).toEqual(['E-commerce', 'Healthcare']);
  });

  it('keeps the projects in the database order with their CV dates', () => {
    const { projects } = toCvPreview(row(), NOW);

    expect(projects.map((cvProject) => cvProject.project.name)).toEqual([
      'Shop B',
      'Clinic',
      'Shop A',
    ]);
    expect(projects[0]).toMatchObject({ startDate: day('2023-06-01'), endDate: null });
  });

  it('groups CV skills by category with experience counted from the CV projects', () => {
    expect(toCvPreview(row(), NOW).skillGroups).toEqual([
      {
        category: FRONTEND,
        skills: [
          {
            skill: { id: 'skill-Angular', name: 'Angular', category: FRONTEND },
            experienceYears: null,
            lastUsedYear: null,
          },
          {
            skill: { id: 'skill-React', name: 'React', category: FRONTEND },
            experienceYears: 4,
            lastUsedYear: 2026,
          },
        ],
      },
      {
        category: LANGUAGES,
        skills: [
          {
            skill: { id: 'skill-JavaScript', name: 'JavaScript', category: LANGUAGES },
            experienceYears: 4,
            lastUsedYear: 2023,
          },
        ],
      },
    ]);
  });

  it('takes the last used year of a finished project without a CV end date from the project end', () => {
    // Shop B has no CV end date, its project ended 2025-06-30: not "Till now" any more
    const finished = row({
      projects: [
        cvProjectRow('Shop B', 'E-commerce', '2023-06-01', null, [REACT], '2025-06-30'),
        cvProjectRow('Shop A', 'E-commerce', '2022-03-01', '2023-12-31', [REACT, JAVASCRIPT]),
      ],
    });

    const react = toCvPreview(finished, NOW)
      .skillGroups.flatMap((group) => group.skills)
      .find((cvSkill) => cvSkill.skill.id === REACT.id);

    expect(react).toMatchObject({ experienceYears: 4, lastUsedYear: 2025 });
  });

  it('keeps the CV end date empty in the mapped projects', () => {
    const finished = row({
      projects: [cvProjectRow('Shop B', 'E-commerce', '2023-06-01', null, [REACT], '2025-06-30')],
    });

    expect(toCvPreview(finished, NOW).projects[0]).toMatchObject({ endDate: null });
  });

  it('returns empty lists for a CV without skills, projects and owner languages', () => {
    const empty = row({
      skills: [],
      projects: [],
      user: { ...row().user, languages: [], position: null },
    });

    expect(toCvPreview(empty, NOW)).toMatchObject({
      user: { position: null },
      languages: [],
      domains: [],
      skillGroups: [],
      projects: [],
    });
  });
});
