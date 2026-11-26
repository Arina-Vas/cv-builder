import { ErrorCode } from '@/common/errors/error-code.enum';
import { Mastery, UserRole } from '@/common/graphql/enums';
import { Prisma } from '@/generated/prisma/client';
import type { PrismaService } from '@/prisma/prisma.service';
import { skillInclude } from '@/skills/skill.mapper';
import { userSkillInclude } from '@/skills/user-skills/user-skill.mapper';
import { UserSkillService } from '@/skills/user-skills/user-skill.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const OWNER_ID = 'user-1';

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

const category = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend', ...TIMESTAMPS };

// A skill row as Prisma returns it with `include: skillInclude`
const skillRow = (name: string) => ({
  id: `skill-${name}`,
  name,
  categoryId: category.id,
  category,
  ...TIMESTAMPS,
});

// An assignment row as Prisma returns it with `include: userSkillInclude`
const userSkillRow = (name: string, mastery: Mastery = Mastery.INTERMEDIATE) => ({
  id: `user-skill-${name}`,
  userId: OWNER_ID,
  skillId: `skill-${name}`,
  mastery,
  skill: skillRow(name),
  ...TIMESTAMPS,
});

const REACT = {
  id: 'skill-React',
  name: 'React',
  category: { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' },
};

const CREATE_INPUT = { userId: OWNER_ID, skillId: 'skill-React', mastery: Mastery.ADVANCED };
const UPDATE_INPUT = { id: 'user-skill-React', userId: OWNER_ID, mastery: Mastery.EXPERT };
const DELETE_ARGS = { userId: OWNER_ID, ids: ['user-skill-React', 'user-skill-Vue'] };

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('UserSkillService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    skill: { findUnique: jest.fn(), findMany: jest.fn() },
    userSkill: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    cvSkill: { findMany: jest.fn() },
  };
  const service = new UserSkillService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    // By default the target user and the selected skill exist
    prisma.user.findUnique.mockResolvedValue({ id: OWNER_ID });
    prisma.userSkill.deleteMany.mockResolvedValue({ count: 0 });
    // By default no CV of the user lists the skills being removed
    prisma.cvSkill.findMany.mockResolvedValue([]);
    prisma.skill.findUnique.mockResolvedValue({ id: 'skill-React' });
  });

  describe('findByUser', () => {
    it('loads the skills of the user grouped by category, then by skill name', async () => {
      prisma.userSkill.findMany.mockResolvedValue([userSkillRow('React')]);

      const result = await service.findByUser(OWNER_ID);

      expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID },
        include: userSkillInclude,
        orderBy: [
          { skill: { category: { name: 'asc' } } },
          { skill: { name: 'asc' } },
          { id: 'asc' },
        ],
      });
      expect(result).toEqual([
        { id: 'user-skill-React', mastery: Mastery.INTERMEDIATE, skill: REACT },
      ]);
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByUser(OWNER_ID)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userSkill.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findAvailable', () => {
    it('loads the skills not assigned to the user, sorted by name, then id', async () => {
      prisma.skill.findMany.mockResolvedValue([skillRow('React')]);

      const result = await service.findAvailable(OWNER_ID);

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        where: { users: { none: { userId: OWNER_ID } } },
        include: skillInclude,
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      expect(result).toEqual([REACT]);
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findAvailable(OWNER_ID)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.skill.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('saves the assignment for the owner and returns it mapped', async () => {
      prisma.userSkill.create.mockResolvedValue(userSkillRow('React', Mastery.ADVANCED));

      const result = await service.create(OWNER, CREATE_INPUT);

      expect(prisma.skill.findUnique).toHaveBeenCalledWith({
        where: { id: 'skill-React' },
        select: { id: true },
      });
      expect(prisma.userSkill.create).toHaveBeenCalledWith({
        data: { userId: OWNER_ID, skillId: 'skill-React', mastery: Mastery.ADVANCED },
        include: userSkillInclude,
      });
      expect(result).toEqual({ id: 'user-skill-React', mastery: Mastery.ADVANCED, skill: REACT });
    });

    it('lets an Admin assign a skill to another user', async () => {
      prisma.userSkill.create.mockResolvedValue(userSkillRow('React', Mastery.ADVANCED));

      await service.create(ADMIN, CREATE_INPUT);

      expect(prisma.userSkill.create).toHaveBeenCalled();
    });

    it("rejects another user's profile for an Employee with FORBIDDEN before any lookup", async () => {
      await expect(service.create(ANOTHER_EMPLOYEE, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.userSkill.create).not.toHaveBeenCalled();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(ADMIN, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userSkill.create).not.toHaveBeenCalled();
    });

    it('rejects a missing skill with BAD_USER_INPUT on skillId', async () => {
      prisma.skill.findUnique.mockResolvedValue(null);

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'skillId' }] },
      });
      expect(prisma.userSkill.create).not.toHaveBeenCalled();
    });

    it('turns an already assigned skill into CONFLICT on the skillId field', async () => {
      prisma.userSkill.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'skillId' },
      });
    });

    it('turns a skill deleted meanwhile (P2003) into BAD_USER_INPUT on skillId', async () => {
      prisma.userSkill.create.mockRejectedValue(prismaError('P2003'));

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'skillId' }] },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');
      prisma.userSkill.create.mockRejectedValue(error);

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toBe(error);
    });
  });

  describe('update', () => {
    it("changes only the mastery of the user's assignment and returns it mapped", async () => {
      prisma.userSkill.update.mockResolvedValue(userSkillRow('React', Mastery.EXPERT));

      const result = await service.update(OWNER, UPDATE_INPUT);

      expect(prisma.userSkill.update).toHaveBeenCalledWith({
        where: { id: 'user-skill-React', userId: OWNER_ID },
        data: { mastery: Mastery.EXPERT },
        include: userSkillInclude,
      });
      expect(result).toEqual({ id: 'user-skill-React', mastery: Mastery.EXPERT, skill: REACT });
    });

    it("rejects another user's profile for an Employee with FORBIDDEN", async () => {
      await expect(service.update(ANOTHER_EMPLOYEE, UPDATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.userSkill.update).not.toHaveBeenCalled();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(ADMIN, UPDATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userSkill.update).not.toHaveBeenCalled();
    });

    it('leaves a missing or foreign assignment (P2025) to the global filter', async () => {
      const error = prismaError('P2025');
      prisma.userSkill.update.mockRejectedValue(error);

      await expect(service.update(OWNER, UPDATE_INPUT)).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    // An assignment as the lookup in delete selects it
    const assignment = (name: string, userId = OWNER_ID) => ({
      id: `user-skill-${name}`,
      userId,
      skillId: `skill-${name}`,
    });

    const expectNothingDeleted = () => {
      expect(prisma.userSkill.deleteMany).not.toHaveBeenCalled();
    };

    it('deletes the assignments of the user and returns their ids', async () => {
      prisma.userSkill.findMany.mockResolvedValue([assignment('React'), assignment('Vue')]);

      const result = await service.delete(OWNER, DELETE_ARGS);

      // Looked up without userId, so an id of another user's assignment is found, not skipped
      expect(prisma.userSkill.findMany).toHaveBeenCalledWith({
        where: { id: { in: DELETE_ARGS.ids } },
        select: { id: true, userId: true, skillId: true },
      });
      expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, id: { in: ['user-skill-React', 'user-skill-Vue'] } },
      });
      expect(result).toEqual(['user-skill-React', 'user-skill-Vue']);
    });

    it("checks only the user's own CVs for the selected skills", async () => {
      prisma.userSkill.findMany.mockResolvedValue([assignment('React'), assignment('Vue')]);

      await service.delete(OWNER, DELETE_ARGS);

      // Another user's CV with the same skill does not block the removal
      expect(prisma.cvSkill.findMany).toHaveBeenCalledWith({
        where: { skillId: { in: ['skill-React', 'skill-Vue'] }, cv: { userId: OWNER_ID } },
        select: { skillId: true },
        distinct: ['skillId'],
      });
    });

    it('rejects skills that are used in CVs with ENTITY_IN_USE and the ids of those assignments', async () => {
      prisma.userSkill.findMany.mockResolvedValue([assignment('React'), assignment('Vue')]);
      prisma.cvSkill.findMany.mockResolvedValue([{ skillId: 'skill-Vue' }]);

      await expect(service.delete(OWNER, DELETE_ARGS)).rejects.toMatchObject({
        message: 'Skills cannot be removed because they are used in CVs',
        // Assignment ids (what the client sent), not skill or CV skill ids
        extensions: { code: ErrorCode.ENTITY_IN_USE, ids: ['user-skill-Vue'] },
      });
      // The whole request is rejected: the free skill (React) is not removed either
      expectNothingDeleted();
    });

    it('skips ids that are already removed', async () => {
      prisma.userSkill.findMany.mockResolvedValue([assignment('React')]);

      const result = await service.delete(OWNER, DELETE_ARGS);

      expect(prisma.cvSkill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { skillId: { in: ['skill-React'] }, cv: { userId: OWNER_ID } },
        }),
      );
      expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, id: { in: ['user-skill-React'] } },
      });
      expect(result).toEqual(['user-skill-React']);
    });

    it('returns an empty list when every id is already removed', async () => {
      prisma.userSkill.findMany.mockResolvedValue([]);

      await expect(service.delete(OWNER, DELETE_ARGS)).resolves.toEqual([]);
    });

    it('fails when the removal fails', async () => {
      prisma.userSkill.findMany.mockResolvedValue([assignment('React')]);
      const error = new Error('connection lost');
      prisma.userSkill.deleteMany.mockRejectedValueOnce(error);

      await expect(service.delete(OWNER, DELETE_ARGS)).rejects.toBe(error);
    });

    it.each([
      ['the owner', OWNER],
      ['an Admin', ADMIN],
    ])(
      "rejects an id of another user's assignment for %s with FORBIDDEN and deletes nothing",
      async (_who, user) => {
        prisma.userSkill.findMany.mockResolvedValue([
          assignment('React'),
          assignment('Vue', 'user-2'),
        ]);

        await expect(service.delete(user, DELETE_ARGS)).rejects.toMatchObject({
          message: 'Skill assignment belongs to another user',
          extensions: { code: ErrorCode.FORBIDDEN },
        });
        expectNothingDeleted();
      },
    );

    it("lets an Admin delete another user's assignments", async () => {
      prisma.userSkill.findMany.mockResolvedValue([assignment('React')]);

      await expect(service.delete(ADMIN, DELETE_ARGS)).resolves.toEqual(['user-skill-React']);
      expect(prisma.userSkill.deleteMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, id: { in: ['user-skill-React'] } },
      });
    });

    it("rejects another user's profile for an Employee with FORBIDDEN", async () => {
      await expect(service.delete(ANOTHER_EMPLOYEE, DELETE_ARGS)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.userSkill.findMany).not.toHaveBeenCalled();
      expectNothingDeleted();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(ADMIN, DELETE_ARGS)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expectNothingDeleted();
    });
  });
});
