import { toProject, type ProjectWithTechnologies } from './project.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');
const startDate = new Date('2025-03-01T00:00:00.000Z');
const endDate = new Date('2025-12-31T00:00:00.000Z');

const category = {
  id: 'category-1',
  name: 'Frontend frameworks',
  type: 'Frontend',
  createdAt,
  updatedAt: createdAt,
};

const row: ProjectWithTechnologies = {
  id: 'project-1',
  name: 'CV Builder',
  domain: 'HR',
  startDate,
  endDate,
  description: 'Internal tool for employee CVs',
  technologies: [
    {
      id: 'project-skill-1',
      projectId: 'project-1',
      skillId: 'skill-1',
      skill: {
        id: 'skill-1',
        name: 'React',
        categoryId: 'category-1',
        category,
        createdAt,
        updatedAt: createdAt,
      },
      createdAt,
      updatedAt: createdAt,
    },
    {
      id: 'project-skill-2',
      projectId: 'project-1',
      skillId: 'skill-2',
      skill: {
        id: 'skill-2',
        name: 'Next.js',
        categoryId: 'category-1',
        category,
        createdAt,
        updatedAt: createdAt,
      },
      createdAt,
      updatedAt: createdAt,
    },
  ],
  createdAt,
  updatedAt: createdAt,
};

describe('toProject', () => {
  it('maps the project and unwraps technologies into skills', () => {
    const skillCategory = { id: 'category-1', name: 'Frontend frameworks', type: 'Frontend' };

    expect(toProject(row)).toEqual({
      id: 'project-1',
      name: 'CV Builder',
      domain: 'HR',
      startDate,
      endDate,
      description: 'Internal tool for employee CVs',
      technologies: [
        { id: 'skill-1', name: 'React', category: skillCategory },
        { id: 'skill-2', name: 'Next.js', category: skillCategory },
      ],
    });
  });

  it('keeps dates as Date objects, the Date scalar formats them', () => {
    const project = toProject(row);

    expect(project.startDate).toBeInstanceOf(Date);
    expect(project.endDate).toBeInstanceOf(Date);
  });

  it('maps a project without skills to empty technologies', () => {
    expect(toProject({ ...row, technologies: [] }).technologies).toEqual([]);
  });
});
