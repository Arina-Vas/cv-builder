import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import type { CvAccessService } from '@/cvs/cv-access.service';
import { cvInclude, type CvWithUser } from '@/cvs/cv.mapper';
import { CvService } from '@/cvs/cv.service';
import { CvsArgs } from '@/cvs/dto/cvs.args';
import { UserCvsArgs } from '@/cvs/dto/user-cvs.args';
import type { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const OWNER_ID = 'user-1';
const CV_ID = 'cv-1';

const currentUser = (id: string, role: UserRole): User => ({
  id,
  email: `${id}@example.com`,
  firstName: null,
  lastName: null,
  avatarKey: null,
  role,
  position: null,
  department: null,
  emailVerifiedAt: TIMESTAMPS.createdAt,
  createdAt: TIMESTAMPS.createdAt,
});

const OWNER = currentUser(OWNER_ID, UserRole.EMPLOYEE);
const ANOTHER_EMPLOYEE = currentUser('user-2', UserRole.EMPLOYEE);
const ADMIN = currentUser('admin-1', UserRole.ADMIN);

// A CV row as Prisma returns it with `include: cvInclude`
const cvRow = (name = 'Frontend Developer'): CvWithUser => ({
  id: CV_ID,
  name,
  education: 'BSUIR',
  description: 'Five years of web development',
  userId: OWNER_ID,
  user: {
    id: OWNER_ID,
    email: 'user-1@example.com',
    emailVerifiedAt: null,
    passwordHash: 'secret-hash',
    firstName: 'Anna',
    lastName: 'Smith',
    role: UserRole.EMPLOYEE,
    avatarKey: null,
    departmentId: null,
    department: null,
    positionId: null,
    position: null,
    ...TIMESTAMPS,
  },
  ...TIMESTAMPS,
});

// What the API returns for `cvRow()`: no owner id, no timestamps, no credentials
const CV = {
  id: CV_ID,
  name: 'Frontend Developer',
  education: 'BSUIR',
  description: 'Five years of web development',
  user: {
    id: OWNER_ID,
    email: 'user-1@example.com',
    firstName: 'Anna',
    lastName: 'Smith',
    avatarKey: null,
    role: UserRole.EMPLOYEE,
    position: null,
    department: null,
    emailVerifiedAt: null,
    createdAt: TIMESTAMPS.createdAt,
  },
};

const INSENSITIVE = (search: string) => ({ contains: search, mode: 'insensitive' });

// Args go through class-transformer, so the defaults (page 1, size 10, sort by name ASC) apply
const cvsArgs = (plain: object = {}): CvsArgs => plainToInstance(CvsArgs, plain);
const userCvsArgs = (plain: object = {}): UserCvsArgs =>
  plainToInstance(UserCvsArgs, { userId: OWNER_ID, ...plain });

const CREATE_INPUT = {
  userId: OWNER_ID,
  name: 'Frontend Developer',
  education: 'BSUIR',
  description: 'Five years of web development',
};
const UPDATE_INPUT = { ...CREATE_INPUT, id: CV_ID };

describe('CvService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    cv: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const cvAccess = { getAccessibleCv: jest.fn() };
  const service = new CvService(
    prisma as unknown as PrismaService,
    cvAccess as unknown as CvAccessService,
  );

  // The `where` passed to findMany; count must get the same one
  const listWhere = () => {
    const [[{ where }]] = prisma.cv.findMany.mock.calls as [[{ where: unknown }]];
    expect(prisma.cv.count).toHaveBeenCalledWith({ where });
    return where;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // By default the target user exists and the list has one CV
    prisma.user.findUnique.mockResolvedValue({ id: OWNER_ID });
    prisma.cv.findMany.mockResolvedValue([cvRow()]);
    prisma.cv.count.mockResolvedValue(1);
  });

  describe('findAll', () => {
    it('shows an Employee only their own CVs', async () => {
      await service.findAll(OWNER, cvsArgs());

      expect(listWhere()).toEqual({ userId: OWNER_ID });
    });

    it('searches an Employee CVs by name only, case-insensitively', async () => {
      await service.findAll(OWNER, cvsArgs({ search: 'front' }));

      expect(listWhere()).toEqual({ userId: OWNER_ID, name: INSENSITIVE('front') });
    });

    it('shows an Admin all CVs', async () => {
      await service.findAll(ADMIN, cvsArgs());

      expect(listWhere()).toEqual({});
    });

    it('searches an Admin list by CV name or owner email, case-insensitively', async () => {
      await service.findAll(ADMIN, cvsArgs({ search: 'Front' }));

      expect(listWhere()).toEqual({
        OR: [{ name: INSENSITIVE('Front') }, { user: { email: INSENSITIVE('Front') } }],
      });
    });

    it('ignores a blank search', async () => {
      await service.findAll(ADMIN, cvsArgs({ search: '   ' }));

      expect(listWhere()).toEqual({});
    });

    it('matches LIKE wildcards in the search literally', async () => {
      await service.findAll(ADMIN, cvsArgs({ search: '%_' }));

      expect(listWhere()).toEqual({
        OR: [{ name: INSENSITIVE('\\%\\_') }, { user: { email: INSENSITIVE('\\%\\_') } }],
      });
    });

    it('sorts by the requested field with id as a tie-breaker and pages the result', async () => {
      await service.findAll(ADMIN, cvsArgs({ sortOrder: SortOrder.DESC, page: 3, pageSize: 20 }));

      expect(prisma.cv.findMany).toHaveBeenCalledWith({
        where: {},
        include: cvInclude,
        orderBy: [{ name: 'desc' }, { id: 'asc' }],
        skip: 40,
        take: 20,
      });
    });

    it('reads the list and the total in one transaction', async () => {
      await service.findAll(ADMIN, cvsArgs());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('returns mapped items with the page info', async () => {
      prisma.cv.count.mockResolvedValue(21);

      await expect(service.findAll(OWNER, cvsArgs({ page: 2, pageSize: 20 }))).resolves.toEqual({
        items: [CV],
        total: 21,
        page: 2,
        pageSize: 20,
      });
    });
  });

  describe('findByUser', () => {
    it('lists the CVs of the given user for that user', async () => {
      await service.findByUser(OWNER, userCvsArgs());

      expect(listWhere()).toEqual({ userId: OWNER_ID });
    });

    it('lists the CVs of any user for an Admin', async () => {
      await service.findByUser(ADMIN, userCvsArgs());

      expect(listWhere()).toEqual({ userId: OWNER_ID });
    });

    it('searches by CV name only, case-insensitively', async () => {
      await service.findByUser(ADMIN, userCvsArgs({ search: 'Front' }));

      expect(listWhere()).toEqual({ userId: OWNER_ID, name: INSENSITIVE('Front') });
    });

    it('returns mapped items with the page info', async () => {
      await expect(service.findByUser(ADMIN, userCvsArgs())).resolves.toEqual({
        items: [CV],
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it("rejects another user's CVs for an Employee with FORBIDDEN", async () => {
      await expect(service.findByUser(ANOTHER_EMPLOYEE, userCvsArgs())).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.cv.findMany).not.toHaveBeenCalled();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByUser(ADMIN, userCvsArgs())).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.cv.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('checks access through CvAccessService and maps the CV', async () => {
      cvAccess.getAccessibleCv.mockResolvedValue(cvRow());

      await expect(service.findOne(OWNER, CV_ID)).resolves.toEqual(CV);
      expect(cvAccess.getAccessibleCv).toHaveBeenCalledWith(CV_ID, OWNER);
    });

    it('passes the access error through', async () => {
      const error = new Error('Forbidden');
      cvAccess.getAccessibleCv.mockRejectedValue(error);

      await expect(service.findOne(ANOTHER_EMPLOYEE, CV_ID)).rejects.toBe(error);
    });
  });

  describe('create', () => {
    beforeEach(() => {
      prisma.cv.create.mockResolvedValue(cvRow());
    });

    it.each([
      ['an Employee for themselves', OWNER],
      ['an Admin for an employee', ADMIN],
    ])('creates a CV by %s', async (_case, user) => {
      await expect(service.create(user, CREATE_INPUT)).resolves.toEqual(CV);
      expect(prisma.cv.create).toHaveBeenCalledWith({
        data: CREATE_INPUT,
        include: cvInclude,
      });
    });

    it('rejects a CV for another user from an Employee with FORBIDDEN', async () => {
      await expect(service.create(ANOTHER_EMPLOYEE, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.cv.create).not.toHaveBeenCalled();
    });

    it('rejects a missing owner with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(ADMIN, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.cv.create).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.cv.update.mockResolvedValue(cvRow('Senior Frontend Developer'));
    });

    it('updates the CV of the given owner without changing the owner', async () => {
      const result = await service.update(ADMIN, {
        ...UPDATE_INPUT,
        name: 'Senior Frontend Developer',
      });

      expect(prisma.cv.update).toHaveBeenCalledWith({
        where: { id: CV_ID, userId: OWNER_ID },
        data: {
          name: 'Senior Frontend Developer',
          education: 'BSUIR',
          description: 'Five years of web development',
        },
        include: cvInclude,
      });
      expect(result).toEqual({ ...CV, name: 'Senior Frontend Developer' });
    });

    it('lets an Employee update their own CV', async () => {
      await service.update(OWNER, UPDATE_INPUT);

      expect(prisma.cv.update).toHaveBeenCalledTimes(1);
    });

    it("rejects another user's CV for an Employee with FORBIDDEN", async () => {
      await expect(service.update(ANOTHER_EMPLOYEE, UPDATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.cv.update).not.toHaveBeenCalled();
    });

    it('rejects a missing owner with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(ADMIN, UPDATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.cv.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    beforeEach(() => {
      prisma.cv.delete.mockResolvedValue(cvRow());
    });

    it('deletes the CV of the given owner and returns its id', async () => {
      await expect(service.delete(ADMIN, CV_ID, OWNER_ID)).resolves.toBe(CV_ID);
      expect(prisma.cv.delete).toHaveBeenCalledWith({ where: { id: CV_ID, userId: OWNER_ID } });
    });

    it('lets an Employee delete their own CV', async () => {
      await expect(service.delete(OWNER, CV_ID, OWNER_ID)).resolves.toBe(CV_ID);
    });

    it("rejects another user's CV for an Employee with FORBIDDEN", async () => {
      await expect(service.delete(ANOTHER_EMPLOYEE, CV_ID, OWNER_ID)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.cv.delete).not.toHaveBeenCalled();
    });

    it('rejects a missing owner with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(ADMIN, CV_ID, OWNER_ID)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.cv.delete).not.toHaveBeenCalled();
    });
  });
});
