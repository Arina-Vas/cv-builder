import { plainToInstance } from 'class-transformer';
import { GraphQLError } from 'graphql';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { UserRole } from '@/common/graphql/enums';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { Prisma } from '@/generated/prisma/client';
import type { CvAccessService } from '@/cvs/cv-access.service';
import { cvProjectInclude } from '@/cvs/cv-projects/cv-project.mapper';
import { CvProjectService } from '@/cvs/cv-projects/cv-project.service';
import { CvProjectsArgs } from '@/cvs/cv-projects/dto/cv-projects.args';
import type { CreateCvProjectInput } from '@/cvs/cv-projects/dto/create-cv-project.input';
import type { UpdateCvProjectInput } from '@/cvs/cv-projects/dto/update-cv-project.input';
import { CvProjectSortField } from '@/cvs/cv-projects/models/cv-project-sort-field.enum';
import { projectInclude } from '@/projects/project.mapper';
import type { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const day = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

const CV_ID = 'cv-1';
const PROJECT_ID = 'project-1';
const CV_PROJECT_ID = 'cv-project-1';
const ROLE_IDS = ['role-Developer', 'role-Team Lead'];

// The catalog project runs through 2026
const PERIOD = { startDate: day('2026-01-01'), endDate: day('2026-12-31') };

const OWNER: User = {
  id: 'user-1',
  email: 'user-1@example.com',
  firstName: null,
  lastName: null,
  avatarKey: null,
  role: UserRole.EMPLOYEE,
  position: null,
  department: null,
  emailVerifiedAt: TIMESTAMPS.createdAt,
  createdAt: TIMESTAMPS.createdAt,
};

// A row as Prisma returns it with `include: cvProjectInclude`
const cvProjectRow = (name = 'CV Builder') => ({
  id: `cv-project-${name}`,
  cvId: CV_ID,
  projectId: `project-${name}`,
  startDate: day('2026-02-01'),
  endDate: null,
  responsibilities: null,
  project: {
    id: `project-${name}`,
    name,
    domain: 'HR',
    description: `${name} description`,
    ...PERIOD,
    technologies: [],
    ...TIMESTAMPS,
  },
  roles: [],
  ...TIMESTAMPS,
});

const CREATE_INPUT: CreateCvProjectInput = {
  cvId: CV_ID,
  projectId: PROJECT_ID,
  startDate: day('2026-02-01'),
  endDate: day('2026-06-30'),
  roleIds: ROLE_IDS,
  responsibilities: 'Wrote the API',
};

const UPDATE_INPUT: UpdateCvProjectInput = {
  id: CV_PROJECT_ID,
  cvId: CV_ID,
  startDate: day('2026-03-01'),
  endDate: null,
  roleIds: ['role-Developer'],
  responsibilities: '',
};

// Args go through class-transformer, so the defaults (sort by name ASC) apply
const args = (plain: object = {}): CvProjectsArgs =>
  plainToInstance(CvProjectsArgs, { cvId: CV_ID, ...plain });

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

/** The GraphQL error a promise rejects with. */
const rejection = async (promise: Promise<unknown>): Promise<GraphQLError> => {
  try {
    await promise;
  } catch (error) {
    return error as GraphQLError;
  }
  throw new Error('Expected the promise to reject');
};

describe('CvProjectService', () => {
  const prisma = {
    cvProject: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    projectRole: {
      count: jest.fn(),
    },
  };
  const cvAccess = { getAccessibleCv: jest.fn() };
  const service = new CvProjectService(
    prisma as unknown as PrismaService,
    cvAccess as unknown as CvAccessService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    // By default the user may open the CV, the project exists and every role exists
    cvAccess.getAccessibleCv.mockResolvedValue({ id: CV_ID });
    prisma.cvProject.findMany.mockResolvedValue([cvProjectRow()]);
    prisma.cvProject.findFirst.mockResolvedValue({ project: PERIOD });
    prisma.cvProject.create.mockResolvedValue(cvProjectRow());
    prisma.cvProject.update.mockResolvedValue(cvProjectRow());
    prisma.cvProject.deleteMany.mockResolvedValue({ count: 1 });
    prisma.project.findUnique.mockResolvedValue(PERIOD);
    prisma.projectRole.count.mockImplementation(({ where }: { where: { id: { in: string[] } } }) =>
      Promise.resolve(where.id.in.length),
    );
  });

  describe('access', () => {
    it.each([
      ['findAll', () => service.findAll(OWNER, args())],
      ['findAvailable', () => service.findAvailable(OWNER, CV_ID)],
      ['create', () => service.create(OWNER, CREATE_INPUT)],
      ['update', () => service.update(OWNER, UPDATE_INPUT)],
      ['delete', () => service.delete(OWNER, CV_PROJECT_ID, CV_ID)],
    ])('%s checks access to the CV and stops when it is denied', async (_name, call) => {
      cvAccess.getAccessibleCv.mockRejectedValue(forbidden());

      expect((await rejection(call())).extensions.code).toBe(ErrorCode.FORBIDDEN);
      expect(cvAccess.getAccessibleCv).toHaveBeenCalledWith(CV_ID, OWNER);
      expect(prisma.cvProject.findMany).not.toHaveBeenCalled();
      expect(prisma.cvProject.create).not.toHaveBeenCalled();
      expect(prisma.cvProject.update).not.toHaveBeenCalled();
      expect(prisma.cvProject.deleteMany).not.toHaveBeenCalled();
      expect(prisma.project.findMany).not.toHaveBeenCalled();
    });

    it('passes NOT_FOUND for a missing CV through', async () => {
      cvAccess.getAccessibleCv.mockRejectedValue(notFound('CV not found'));

      expect((await rejection(service.findAll(OWNER, args()))).extensions.code).toBe(
        ErrorCode.NOT_FOUND,
      );
    });
  });

  describe('findAll', () => {
    it('loads the projects of this CV only, sorted by project name, then id', async () => {
      await service.findAll(OWNER, args());

      expect(prisma.cvProject.findMany).toHaveBeenCalledWith({
        where: { cvId: CV_ID },
        include: cvProjectInclude,
        orderBy: [{ project: { name: 'asc' } }, { id: 'asc' }],
      });
    });

    it('searches by project name or domain case-insensitively', async () => {
      await service.findAll(OWNER, args({ search: 'hr' }));

      expect(prisma.cvProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            cvId: CV_ID,
            project: {
              OR: [
                { name: { contains: 'hr', mode: 'insensitive' } },
                { domain: { contains: 'hr', mode: 'insensitive' } },
              ],
            },
          },
        }),
      );
    });

    it.each([
      [CvProjectSortField.name, SortOrder.DESC, { project: { name: 'desc' } }],
      [CvProjectSortField.startDate, SortOrder.ASC, { startDate: 'asc' }],
      [CvProjectSortField.startDate, SortOrder.DESC, { startDate: 'desc' }],
      // "Till now" (no end date) is the latest: last ascending, first descending
      [CvProjectSortField.endDate, SortOrder.ASC, { endDate: { sort: 'asc', nulls: 'last' } }],
      [CvProjectSortField.endDate, SortOrder.DESC, { endDate: { sort: 'desc', nulls: 'first' } }],
    ])('sorts by %s %s', async (sortBy, sortOrder, expected) => {
      await service.findAll(OWNER, args({ sortBy, sortOrder }));

      expect(prisma.cvProject.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [expected, { id: 'asc' }] }),
      );
    });

    it('returns mapped items and their count', async () => {
      prisma.cvProject.findMany.mockResolvedValue([cvProjectRow('Blog'), cvProjectRow('Payroll')]);

      const result = await service.findAll(OWNER, args());

      expect(result.total).toBe(2);
      expect(result.items.map((item) => item.project.name)).toEqual(['Blog', 'Payroll']);
      expect(result.items[0]).not.toHaveProperty('cvId');
    });
  });

  describe('findAvailable', () => {
    it('returns catalog projects not yet in the CV, sorted by name', async () => {
      prisma.project.findMany.mockResolvedValue([cvProjectRow('Blog').project]);

      const result = await service.findAvailable(OWNER, CV_ID);

      expect(prisma.project.findMany).toHaveBeenCalledWith({
        where: { cvs: { none: { cvId: CV_ID } } },
        include: projectInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      expect(result.map((project) => project.name)).toEqual(['Blog']);
    });
  });

  describe('create', () => {
    it('saves the CV project with its roles and returns it mapped', async () => {
      const result = await service.create(OWNER, CREATE_INPUT);

      expect(prisma.cvProject.create).toHaveBeenCalledWith({
        data: {
          cvId: CV_ID,
          projectId: PROJECT_ID,
          startDate: day('2026-02-01'),
          endDate: day('2026-06-30'),
          responsibilities: 'Wrote the API',
          roles: { create: [{ roleId: 'role-Developer' }, { roleId: 'role-Team Lead' }] },
        },
        include: cvProjectInclude,
      });
      expect(result.project.name).toBe('CV Builder');
    });

    it('saves a missing end date and blank responsibilities as null', async () => {
      await service.create(OWNER, { ...CREATE_INPUT, endDate: undefined, responsibilities: '' });

      expect(prisma.cvProject.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ endDate: null, responsibilities: null }),
        }),
      );
    });

    it('accepts dates on the project boundaries', async () => {
      await service.create(OWNER, { ...CREATE_INPUT, ...PERIOD });

      expect(prisma.cvProject.create).toHaveBeenCalled();
    });

    it('rejects a project that does not exist with BAD_USER_INPUT on projectId', async () => {
      prisma.project.findUnique.mockResolvedValue(null);

      const error = await rejection(service.create(OWNER, CREATE_INPUT));

      expect(error.extensions).toMatchObject({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'projectId', message: 'Project not found' }],
      });
      expect(prisma.cvProject.create).not.toHaveBeenCalled();
    });

    it.each([
      ['before the project starts', day('2025-12-31')],
      ['after the project ends', day('2027-01-01')],
    ])('rejects a start date %s', async (_case, startDate) => {
      const error = await rejection(
        service.create(OWNER, { ...CREATE_INPUT, startDate, endDate: null }),
      );

      expect(error.extensions).toMatchObject({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'startDate', message: 'Start date must be within project duration' }],
      });
      expect(prisma.cvProject.create).not.toHaveBeenCalled();
    });

    it('rejects an end date after the project ends', async () => {
      const error = await rejection(
        service.create(OWNER, { ...CREATE_INPUT, endDate: day('2027-01-01') }),
      );

      expect(error.extensions).toMatchObject({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'endDate', message: 'End date must be within project duration' }],
      });
    });

    it('reports both dates at once when both are outside the project', async () => {
      const error = await rejection(
        service.create(OWNER, {
          ...CREATE_INPUT,
          startDate: day('2025-06-01'),
          endDate: day('2027-06-01'),
        }),
      );

      expect(error.extensions.fields).toEqual([
        { field: 'startDate', message: 'Start date must be within project duration' },
        { field: 'endDate', message: 'End date must be within project duration' },
      ]);
    });

    it('rejects a role that does not exist with BAD_USER_INPUT on roleIds', async () => {
      prisma.projectRole.count.mockResolvedValue(1);

      const error = await rejection(service.create(OWNER, CREATE_INPUT));

      expect(error.extensions).toMatchObject({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'roleIds', message: 'Role not found' }],
      });
      expect(prisma.cvProject.create).not.toHaveBeenCalled();
    });

    it('maps a duplicate project in the CV (P2002) to CONFLICT on projectId', async () => {
      prisma.cvProject.create.mockRejectedValue(prismaError('P2002'));

      const error = await rejection(service.create(OWNER, CREATE_INPUT));

      expect(error.extensions).toMatchObject({ code: ErrorCode.CONFLICT, field: 'projectId' });
    });

    it('maps a role deleted meanwhile (P2003) to BAD_USER_INPUT on roleIds', async () => {
      prisma.cvProject.create.mockRejectedValue(prismaError('P2003'));

      const error = await rejection(service.create(OWNER, CREATE_INPUT));

      expect(error.extensions).toMatchObject({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'roleIds' }],
      });
    });

    it('rethrows other database errors', async () => {
      prisma.cvProject.create.mockRejectedValue(new Error('connection lost'));

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toThrow('connection lost');
    });
  });

  describe('update', () => {
    it('looks the CV project up within this CV only', async () => {
      await service.update(OWNER, UPDATE_INPUT);

      expect(prisma.cvProject.findFirst).toHaveBeenCalledWith({
        where: { id: CV_PROJECT_ID, cvId: CV_ID },
        select: { project: { select: { startDate: true, endDate: true } } },
      });
    });

    it('changes the dates and responsibilities and replaces the whole role set', async () => {
      await service.update(OWNER, UPDATE_INPUT);

      expect(prisma.cvProject.update).toHaveBeenCalledWith({
        where: { id: CV_PROJECT_ID },
        data: {
          startDate: day('2026-03-01'),
          endDate: null,
          responsibilities: null,
          roles: { deleteMany: {}, create: [{ roleId: 'role-Developer' }] },
        },
        include: cvProjectInclude,
      });
    });

    it('fails with NOT_FOUND when the CV project is not in this CV', async () => {
      prisma.cvProject.findFirst.mockResolvedValue(null);

      const error = await rejection(service.update(OWNER, UPDATE_INPUT));

      expect(error.extensions.code).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe('CV project not found');
      expect(prisma.cvProject.update).not.toHaveBeenCalled();
    });

    it('checks the dates against the stored project', async () => {
      const error = await rejection(
        service.update(OWNER, { ...UPDATE_INPUT, startDate: day('2027-02-01') }),
      );

      expect(error.extensions).toMatchObject({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'startDate' }],
      });
      expect(prisma.cvProject.update).not.toHaveBeenCalled();
    });

    it('rejects a role that does not exist with BAD_USER_INPUT on roleIds', async () => {
      prisma.projectRole.count.mockResolvedValue(0);

      const error = await rejection(service.update(OWNER, UPDATE_INPUT));

      expect(error.extensions).toMatchObject({ fields: [{ field: 'roleIds' }] });
      expect(prisma.cvProject.update).not.toHaveBeenCalled();
    });

    it.each([
      ['P2003', ErrorCode.BAD_USER_INPUT],
      ['P2025', ErrorCode.NOT_FOUND],
    ])('maps %s from the update to %s', async (code, expected) => {
      prisma.cvProject.update.mockRejectedValue(prismaError(code));

      expect((await rejection(service.update(OWNER, UPDATE_INPUT))).extensions.code).toBe(expected);
    });

    it('rethrows other database errors', async () => {
      prisma.cvProject.update.mockRejectedValue(new Error('connection lost'));

      await expect(service.update(OWNER, UPDATE_INPUT)).rejects.toThrow('connection lost');
    });
  });

  describe('delete', () => {
    it('deletes only within this CV and returns the id', async () => {
      const result = await service.delete(OWNER, CV_PROJECT_ID, CV_ID);

      expect(prisma.cvProject.deleteMany).toHaveBeenCalledWith({
        where: { id: CV_PROJECT_ID, cvId: CV_ID },
      });
      expect(result).toBe(CV_PROJECT_ID);
    });

    it('fails with NOT_FOUND when nothing was deleted', async () => {
      prisma.cvProject.deleteMany.mockResolvedValue({ count: 0 });

      const error = await rejection(service.delete(OWNER, CV_PROJECT_ID, CV_ID));

      expect(error.extensions.code).toBe(ErrorCode.NOT_FOUND);
    });
  });
});
