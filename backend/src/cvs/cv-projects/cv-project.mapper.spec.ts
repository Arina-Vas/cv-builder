import { toCvProject, type CvProjectWithRelations } from '@/cvs/cv-projects/cv-project.mapper';

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const START = new Date('2026-02-01T00:00:00.000Z');
const PROJECT_START = new Date('2026-01-01T00:00:00.000Z');
const PROJECT_END = new Date('2026-12-31T00:00:00.000Z');

const FRONTEND = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' };

const role = (name: string) => ({ id: `role-${name}`, name, ...TIMESTAMPS });

// A row as Prisma returns it with `include: cvProjectInclude`
const row = (overrides: Partial<CvProjectWithRelations> = {}): CvProjectWithRelations => ({
  id: 'cv-project-1',
  cvId: 'cv-1',
  projectId: 'project-1',
  startDate: START,
  endDate: null,
  responsibilities: 'Wrote the API\nSet up CI',
  project: {
    id: 'project-1',
    name: 'CV Builder',
    domain: 'HR',
    description: 'Internal tool for CVs',
    startDate: PROJECT_START,
    endDate: PROJECT_END,
    technologies: [
      {
        id: 'link-1',
        projectId: 'project-1',
        skillId: 'skill-React',
        skill: {
          id: 'skill-React',
          name: 'React',
          categoryId: FRONTEND.id,
          category: { ...FRONTEND, ...TIMESTAMPS },
          ...TIMESTAMPS,
        },
        ...TIMESTAMPS,
      },
    ],
    ...TIMESTAMPS,
  },
  roles: [
    {
      id: 'link-Developer',
      cvProjectId: 'cv-project-1',
      roleId: 'role-Developer',
      role: role('Developer'),
      ...TIMESTAMPS,
    },
    {
      id: 'link-Team Lead',
      cvProjectId: 'cv-project-1',
      roleId: 'role-Team Lead',
      role: role('Team Lead'),
      ...TIMESTAMPS,
    },
  ],
  ...TIMESTAMPS,
  ...overrides,
});

describe('toCvProject', () => {
  it('maps the CV project with its catalog project and roles, dropping service fields', () => {
    expect(toCvProject(row())).toEqual({
      id: 'cv-project-1',
      startDate: START,
      endDate: null,
      responsibilities: 'Wrote the API\nSet up CI',
      project: {
        id: 'project-1',
        name: 'CV Builder',
        domain: 'HR',
        description: 'Internal tool for CVs',
        startDate: PROJECT_START,
        endDate: PROJECT_END,
        technologies: [{ id: 'skill-React', name: 'React', category: FRONTEND }],
      },
      roles: [
        { id: 'role-Developer', name: 'Developer' },
        { id: 'role-Team Lead', name: 'Team Lead' },
      ],
    });
  });

  it('keeps an end date and empty responsibilities as they are', () => {
    const end = new Date('2026-06-30T00:00:00.000Z');

    expect(toCvProject(row({ endDate: end, responsibilities: null }))).toMatchObject({
      endDate: end,
      responsibilities: null,
    });
  });
});
