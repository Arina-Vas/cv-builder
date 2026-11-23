import { ErrorCode } from '@/common/errors/error-code.enum';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { Mastery, UserRole } from '@/common/graphql/enums';
import { Prisma } from '@/generated/prisma/client';
import type { CvAccessService } from '@/cvs/cv-access.service';
import { cvSkillInclude } from '@/cvs/cv-skills/cv-skill.mapper';
import { CvSkillService } from '@/cvs/cv-skills/cv-skill.service';
import { skillInclude } from '@/skills/skill.mapper';
import type { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const CV_ID = 'cv-1';
const OWNER_ID = 'owner-1';

const ADMIN: User = {
  id: 'admin-1',
  email: 'admin-1@example.com',
  firstName: null,
  lastName: null,
  avatarKey: null,
  role: UserRole.ADMIN,
  position: null,
  department: null,
  emailVerifiedAt: TIMESTAMPS.createdAt,
  createdAt: TIMESTAMPS.createdAt,
};

const category = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend', ...TIMESTAMPS };

// A skill row as Prisma returns it with `include: skillInclude`
const skillRow = (name: string) => ({
  id: `skill-${name}`,
  name,
  categoryId: category.id,
  category,
  ...TIMESTAMPS,
});

// A row as Prisma returns it with `include: cvSkillInclude(ownerId)`
const cvSkillRow = (name: string, mastery: Mastery = Mastery.ADVANCED) => ({
  id: `cv-skill-${name}`,
  cvId: CV_ID,
  skillId: `skill-${name}`,
  skill: { ...skillRow(name), users: [{ mastery }] },
  ...TIMESTAMPS,
});

const REACT = {
  id: 'skill-React',
  name: 'React',
  category: { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' },
};

const CREATE_INPUT = { cvId: CV_ID, skillId: 'skill-React' };
const DELETE_ARGS = { cvId: CV_ID, ids: ['cv-skill-React', 'cv-skill-Vue'] };

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('CvSkillService', () => {
  const prisma = {
    cvSkill: {
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    skill: { findMany: jest.fn() },
    userSkill: { findUnique: jest.fn() },
  };
  const cvAccess = { getAccessibleCv: jest.fn() };
  const service = new CvSkillService(
    prisma as unknown as PrismaService,
    cvAccess as unknown as CvAccessService,
  );

  const expectNothingWritten = () => {
    expect(prisma.cvSkill.create).not.toHaveBeenCalled();
    expect(prisma.cvSkill.deleteMany).not.toHaveBeenCalled();
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // By default the Admin may open the CV of OWNER_ID, and the owner has the selected skill
    cvAccess.getAccessibleCv.mockResolvedValue({ id: CV_ID, userId: OWNER_ID });
    prisma.userSkill.findUnique.mockResolvedValue({ id: 'user-skill-React' });
    prisma.cvSkill.create.mockResolvedValue(cvSkillRow('React'));
    prisma.cvSkill.deleteMany.mockResolvedValue({ count: 0 });
  });

  describe.each([
    ['findByCv', () => service.findByCv(ADMIN, CV_ID)],
    ['findAvailable', () => service.findAvailable(ADMIN, CV_ID)],
    ['create', () => service.create(ADMIN, CREATE_INPUT)],
    ['delete', () => service.delete(ADMIN, DELETE_ARGS)],
  ])('%s access', (_method, call) => {
    it('checks the CV against the current user', async () => {
      prisma.cvSkill.findMany.mockResolvedValue([]);
      prisma.skill.findMany.mockResolvedValue([]);

      await call();

      expect(cvAccess.getAccessibleCv).toHaveBeenCalledWith(CV_ID, ADMIN);
    });

    it.each([
      ['NOT_FOUND for a missing CV', notFound('CV not found'), ErrorCode.NOT_FOUND],
      ["FORBIDDEN for another user's CV", forbidden(), ErrorCode.FORBIDDEN],
    ])('fails with %s and touches nothing', async (_case, error, code) => {
      cvAccess.getAccessibleCv.mockRejectedValue(error);

      await expect(call()).rejects.toMatchObject({ extensions: { code } });
      expect(prisma.cvSkill.findMany).not.toHaveBeenCalled();
      expect(prisma.skill.findMany).not.toHaveBeenCalled();
      expect(prisma.userSkill.findUnique).not.toHaveBeenCalled();
      expectNothingWritten();
    });
  });

  describe('findByCv', () => {
    it("loads the CV skills with the owner's mastery, grouped by category", async () => {
      prisma.cvSkill.findMany.mockResolvedValue([cvSkillRow('React', Mastery.EXPERT)]);

      const result = await service.findByCv(ADMIN, CV_ID);

      // The mastery comes from the CV owner, not from the Admin who opens the CV; skills the owner
      // no longer has are left out
      expect(prisma.cvSkill.findMany).toHaveBeenCalledWith({
        where: { cvId: CV_ID, skill: { users: { some: { userId: OWNER_ID } } } },
        include: cvSkillInclude(OWNER_ID),
        orderBy: [
          { skill: { category: { name: 'asc' } } },
          { skill: { name: 'asc' } },
          { id: 'asc' },
        ],
      });
      expect(result).toEqual([{ id: 'cv-skill-React', mastery: Mastery.EXPERT, skill: REACT }]);
    });

    it('returns an empty list for a CV without skills', async () => {
      prisma.cvSkill.findMany.mockResolvedValue([]);

      await expect(service.findByCv(ADMIN, CV_ID)).resolves.toEqual([]);
    });
  });

  describe('findAvailable', () => {
    it('offers only skills of the CV owner that are not in the CV yet', async () => {
      prisma.skill.findMany.mockResolvedValue([skillRow('React')]);

      const result = await service.findAvailable(ADMIN, CV_ID);

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { users: { some: { userId: OWNER_ID } }, cvs: { none: { cvId: CV_ID } } },
        include: skillInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      expect(result).toEqual([REACT]);
    });
  });

  describe('create', () => {
    it("adds one of the owner's skills to the CV", async () => {
      const result = await service.create(ADMIN, CREATE_INPUT);

      expect(prisma.userSkill.findUnique).toHaveBeenCalledWith({
        where: { userId_skillId: { userId: OWNER_ID, skillId: 'skill-React' } },
        select: { id: true },
      });
      expect(prisma.cvSkill.create).toHaveBeenCalledWith({
        data: { cvId: CV_ID, skillId: 'skill-React' },
        include: cvSkillInclude(OWNER_ID),
      });
      expect(result).toEqual({ id: 'cv-skill-React', mastery: Mastery.ADVANCED, skill: REACT });
    });

    it('rejects a skill the CV owner does not have with BAD_USER_INPUT on skillId', async () => {
      prisma.userSkill.findUnique.mockResolvedValue(null);

      await expect(service.create(ADMIN, CREATE_INPUT)).rejects.toMatchObject({
        extensions: {
          code: ErrorCode.BAD_USER_INPUT,
          fields: [{ field: 'skillId', message: 'Skill is not assigned to the CV owner' }],
        },
      });
      expectNothingWritten();
    });

    it('maps a skill already in the CV (P2002) to CONFLICT on skillId', async () => {
      prisma.cvSkill.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create(ADMIN, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'skillId' },
      });
    });

    it('leaves other database errors to the global filter', async () => {
      const error = prismaError('P2003');
      prisma.cvSkill.create.mockRejectedValue(error);

      await expect(service.create(ADMIN, CREATE_INPUT)).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('deletes the CV skills of this CV and returns their ids', async () => {
      prisma.cvSkill.findMany.mockResolvedValue([
        { id: 'cv-skill-React', cvId: CV_ID },
        { id: 'cv-skill-Vue', cvId: CV_ID },
      ]);

      const result = await service.delete(ADMIN, DELETE_ARGS);

      // Looked up without cvId, so an id of another CV is found, not skipped
      expect(prisma.cvSkill.findMany).toHaveBeenCalledWith({
        where: { id: { in: DELETE_ARGS.ids } },
        select: { id: true, cvId: true },
      });
      expect(prisma.cvSkill.deleteMany).toHaveBeenCalledWith({
        where: { cvId: CV_ID, id: { in: ['cv-skill-React', 'cv-skill-Vue'] } },
      });
      expect(result).toEqual(['cv-skill-React', 'cv-skill-Vue']);
    });

    it('skips ids that are already removed', async () => {
      prisma.cvSkill.findMany.mockResolvedValue([{ id: 'cv-skill-React', cvId: CV_ID }]);

      const result = await service.delete(ADMIN, DELETE_ARGS);

      expect(prisma.cvSkill.deleteMany).toHaveBeenCalledWith({
        where: { cvId: CV_ID, id: { in: ['cv-skill-React'] } },
      });
      expect(result).toEqual(['cv-skill-React']);
    });

    it('rejects an id of another CV with FORBIDDEN and deletes nothing', async () => {
      prisma.cvSkill.findMany.mockResolvedValue([
        { id: 'cv-skill-React', cvId: CV_ID },
        { id: 'cv-skill-Vue', cvId: 'cv-2' },
      ]);

      await expect(service.delete(ADMIN, DELETE_ARGS)).rejects.toMatchObject({
        message: 'Skill belongs to another CV',
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expectNothingWritten();
    });
  });
});
