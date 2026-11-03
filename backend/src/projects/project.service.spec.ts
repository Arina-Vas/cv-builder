import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { Prisma } from '@/generated/prisma/client';
import type { PrismaService } from '@/prisma/prisma.service';
import { ProjectsArgs } from '@/projects/dto/projects.args';
import type { CreateProjectInput } from '@/projects/dto/create-project.input';
import { ProjectSortField } from '@/projects/models/project-sort-field.enum';
import { projectInclude } from '@/projects/project.mapper';
import { ProjectService } from '@/projects/project.service';
import { skillInclude } from '@/skills/skill.mapper';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const START = new Date('2025-03-01T00:00:00.000Z');
const END = new Date('2025-12-31T00:00:00.000Z');

const FRONTEND = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' };

// A skill row as Prisma returns it with `include: skillInclude`
const skillRow = (name: string) => ({
  id: `id-${name}`,
  name,
  categoryId: FRONTEND.id,
  category: { ...FRONTEND, ...TIMESTAMPS },
  ...TIMESTAMPS,
});

// A project row as Prisma returns it with `include: projectInclude`
const projectRow = (name: string, technologies: string[] = []) => ({
  id: `id-${name}`,
  name,
  domain: 'HR',
  description: `${name} description`,
  startDate: START,
  endDate: END,
  technologies: technologies.map((skill) => ({
    id: `link-${name}-${skill}`,
    projectId: `id-${name}`,
    skillId: `id-${skill}`,
    skill: skillRow(skill),
    ...TIMESTAMPS,
  })),
  ...TIMESTAMPS,
});

const FIELDS = {
  name: 'CV Builder',
  domain: 'HR',
  description: 'CV Builder description',
  startDate: START,
  endDate: END,
};
const CV_BUILDER: CreateProjectInput = { ...FIELDS, technologyIds: ['id-React', 'id-Redis'] };

// Args with the same defaults the ValidationPipe applies
const args = (plain: Partial<ProjectsArgs> = {}): ProjectsArgs =>
  plainToInstance(ProjectsArgs, plain);

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('ProjectService', () => {
  const prisma = {
    project: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    skill: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  const service = new ProjectService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.project.findMany.mockResolvedValue([projectRow('Blog'), projectRow('CV Builder')]);
    // By default every submitted technology exists
    prisma.skill.count.mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
      Promise.resolve(where.id.in.length),
    );
  });

  describe('findAll', () => {
    it('loads all projects with technologies, sorted by name, then id', async () => {
      await service.findAll(args());

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        include: projectInclude,
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
    });

    it('searches by name or domain case-insensitively', async () => {
      await service.findAll(args({ search: 'hr' }));

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { name: { contains: 'hr', mode: 'insensitive' } },
              { domain: { contains: 'hr', mode: 'insensitive' } },
            ],
          },
        }),
      );
    });

    it('applies the sort field and order', async () => {
      await service.findAll(
        args({ sortBy: ProjectSortField.startDate, sortOrder: SortOrder.DESC }),
      );

      expect(prisma.project.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ startDate: 'desc' }, { id: 'asc' }] }),
      );
    });

    it('returns mapped projects and their count', async () => {
      prisma.project.findMany.mockResolvedValue([projectRow('Blog', ['React'])]);

      const result = await service.findAll(args());

      expect(result).toEqual({
        items: [
          {
            id: 'id-Blog',
            name: 'Blog',
            domain: 'HR',
            description: 'Blog description',
            startDate: START,
            endDate: END,
            technologies: [{ id: 'id-React', name: 'React', category: FRONTEND }],
          },
        ],
        total: 1,
      });
    });
  });

  describe('findTechnologies', () => {
    it('returns all skills with their category, sorted by name, then id', async () => {
      prisma.skill.findMany.mockResolvedValue([skillRow('React'), skillRow('Redis')]);

      const result = await service.findTechnologies();

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        include: skillInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      expect(result).toEqual([
        { id: 'id-React', name: 'React', category: FRONTEND },
        { id: 'id-Redis', name: 'Redis', category: FRONTEND },
      ]);
    });
  });

  describe('create', () => {
    it('saves the project with its technologies and returns it mapped', async () => {
      prisma.project.create.mockResolvedValue(projectRow('CV Builder', ['React', 'Redis']));

      const result = await service.create(CV_BUILDER);

      expect(prisma.project.create).toHaveBeenCalledWith({
        data: {
          ...FIELDS,
          technologies: { create: [{ skillId: 'id-React' }, { skillId: 'id-Redis' }] },
        },
        include: projectInclude,
      });
      expect(result.technologies.map((skill) => skill.name)).toEqual(['React', 'Redis']);
    });

    it('checks that the technologies exist', async () => {
      prisma.project.create.mockResolvedValue(projectRow('CV Builder'));

      await service.create(CV_BUILDER);

      expect(prisma.skill.count).toHaveBeenCalledWith({
        where: { id: { in: ['id-React', 'id-Redis'] } },
      });
    });

    it('skips the check for a project without technologies', async () => {
      prisma.project.create.mockResolvedValue(projectRow('CV Builder'));

      await service.create({ ...CV_BUILDER, technologyIds: [] });

      expect(prisma.skill.count).not.toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ...FIELDS, technologies: { create: [] } } }),
      );
    });

    it('rejects an unknown technology with BAD_USER_INPUT on technologyIds', async () => {
      prisma.skill.count.mockResolvedValue(1);

      await expect(service.create(CV_BUILDER)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'technologyIds' }] },
      });
      expect(prisma.project.create).not.toHaveBeenCalled();
    });

    it('turns a technology deleted meanwhile (P2003) into BAD_USER_INPUT on technologyIds', async () => {
      prisma.project.create.mockRejectedValue(prismaError('P2003'));

      await expect(service.create(CV_BUILDER)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'technologyIds' }] },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');
      prisma.project.create.mockRejectedValue(error);

      await expect(service.create(CV_BUILDER)).rejects.toBe(error);
    });
  });

  describe('update', () => {
    const UPDATE = { ...CV_BUILDER, id: 'id-CV Builder', technologyIds: ['id-TypeScript'] };

    it('saves the fields, replaces the technologies and returns the project mapped', async () => {
      prisma.project.update.mockResolvedValue(projectRow('CV Builder', ['TypeScript']));

      const result = await service.update(UPDATE);

      expect(prisma.project.update).toHaveBeenCalledWith({
        where: { id: 'id-CV Builder' },
        data: {
          ...FIELDS,
          technologies: { deleteMany: {}, create: [{ skillId: 'id-TypeScript' }] },
        },
        include: projectInclude,
      });
      expect(result.technologies.map((skill) => skill.name)).toEqual(['TypeScript']);
    });

    it('removes all technologies when the list is empty', async () => {
      prisma.project.update.mockResolvedValue(projectRow('CV Builder'));

      await service.update({ ...UPDATE, technologyIds: [] });

      expect(prisma.project.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { ...FIELDS, technologies: { deleteMany: {}, create: [] } },
        }),
      );
    });

    it('rejects an unknown technology with BAD_USER_INPUT on technologyIds', async () => {
      prisma.skill.count.mockResolvedValue(0);

      await expect(service.update(UPDATE)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'technologyIds' }] },
      });
      expect(prisma.project.update).not.toHaveBeenCalled();
    });

    it('turns a technology deleted meanwhile (P2003) into BAD_USER_INPUT on technologyIds', async () => {
      prisma.project.update.mockRejectedValue(prismaError('P2003'));

      await expect(service.update(UPDATE)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'technologyIds' }] },
      });
    });

    it('leaves a missing project (P2025) to the global filter', async () => {
      const error = prismaError('P2025');
      prisma.project.update.mockRejectedValue(error);

      await expect(service.update(UPDATE)).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('deletes the project and returns its id', async () => {
      prisma.project.delete.mockResolvedValue(projectRow('Blog'));

      const result = await service.delete('id-Blog');

      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'id-Blog' } });
      expect(result).toBe('id-Blog');
    });

    it.each(['P2003', 'P2025'])('leaves %s to the global filter', async (code) => {
      const error = prismaError(code);
      prisma.project.delete.mockRejectedValue(error);

      await expect(service.delete('id-Blog')).rejects.toBe(error);
    });
  });
});
