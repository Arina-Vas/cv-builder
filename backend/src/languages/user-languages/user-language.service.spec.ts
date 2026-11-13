import { ErrorCode } from '@/common/errors/error-code.enum';
import { Proficiency, UserRole } from '@/common/graphql/enums';
import { Prisma } from '@/generated/prisma/client';
import { userLanguageInclude } from '@/languages/user-languages/user-language.mapper';
import { UserLanguageService } from '@/languages/user-languages/user-language.service';
import type { PrismaService } from '@/prisma/prisma.service';
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

// A language row as Prisma returns it
const languageRow = (name: string, iso: string) => ({
  id: `language-${name}`,
  name,
  iso,
  nativeName: name,
  ...TIMESTAMPS,
});

// An assignment row as Prisma returns it with `include: userLanguageInclude`
const userLanguageRow = (proficiency: Proficiency = Proficiency.B2) => ({
  id: 'user-language-English',
  userId: OWNER_ID,
  languageId: 'language-English',
  proficiency,
  language: languageRow('English', 'EN'),
  ...TIMESTAMPS,
});

const ENGLISH = { id: 'language-English', name: 'English', iso: 'EN', nativeName: 'English' };

const CREATE_INPUT = {
  userId: OWNER_ID,
  languageId: 'language-English',
  proficiency: Proficiency.C1,
};
const UPDATE_INPUT = {
  id: 'user-language-English',
  userId: OWNER_ID,
  proficiency: Proficiency.NATIVE,
};
const DELETE_ARGS = {
  userId: OWNER_ID,
  ids: ['user-language-English', 'user-language-German'],
};

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('UserLanguageService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    language: { findUnique: jest.fn(), findMany: jest.fn() },
    userLanguage: {
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  };
  const service = new UserLanguageService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    // By default the target user and the selected language exist
    prisma.user.findUnique.mockResolvedValue({ id: OWNER_ID });
    prisma.language.findUnique.mockResolvedValue({ id: 'language-English' });
  });

  describe('findByUser', () => {
    it('loads the languages of the user sorted by language name, then id', async () => {
      prisma.userLanguage.findMany.mockResolvedValue([userLanguageRow()]);

      const result = await service.findByUser(OWNER_ID);

      expect(prisma.userLanguage.findMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID },
        include: userLanguageInclude,
        orderBy: [{ language: { name: 'asc' } }, { id: 'asc' }],
      });
      expect(result).toEqual([
        { id: 'user-language-English', proficiency: Proficiency.B2, language: ENGLISH },
      ]);
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByUser(OWNER_ID)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userLanguage.findMany).not.toHaveBeenCalled();
    });
  });

  describe('findAvailable', () => {
    it('loads the languages not assigned to the user, sorted by name, then id', async () => {
      prisma.language.findMany.mockResolvedValue([languageRow('English', 'EN')]);

      const result = await service.findAvailable(OWNER_ID);

      expect(prisma.language.findMany).toHaveBeenCalledWith({
        where: { users: { none: { userId: OWNER_ID } } },
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      expect(result).toEqual([ENGLISH]);
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findAvailable(OWNER_ID)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.language.findMany).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('saves the assignment for the owner and returns it mapped', async () => {
      prisma.userLanguage.create.mockResolvedValue(userLanguageRow(Proficiency.C1));

      const result = await service.create(OWNER, CREATE_INPUT);

      expect(prisma.language.findUnique).toHaveBeenCalledWith({
        where: { id: 'language-English' },
        select: { id: true },
      });
      expect(prisma.userLanguage.create).toHaveBeenCalledWith({
        data: { userId: OWNER_ID, languageId: 'language-English', proficiency: Proficiency.C1 },
        include: userLanguageInclude,
      });
      expect(result).toEqual({
        id: 'user-language-English',
        proficiency: Proficiency.C1,
        language: ENGLISH,
      });
    });

    it('lets an Admin assign a language to another user', async () => {
      prisma.userLanguage.create.mockResolvedValue(userLanguageRow(Proficiency.C1));

      await service.create(ADMIN, CREATE_INPUT);

      expect(prisma.userLanguage.create).toHaveBeenCalled();
    });

    it("rejects another user's profile for an Employee with FORBIDDEN before any lookup", async () => {
      await expect(service.create(ANOTHER_EMPLOYEE, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
      expect(prisma.userLanguage.create).not.toHaveBeenCalled();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.create(ADMIN, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userLanguage.create).not.toHaveBeenCalled();
    });

    it('rejects a missing language with BAD_USER_INPUT on languageId', async () => {
      prisma.language.findUnique.mockResolvedValue(null);

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'languageId' }] },
      });
      expect(prisma.userLanguage.create).not.toHaveBeenCalled();
    });

    it('turns an already assigned language into CONFLICT on the languageId field', async () => {
      prisma.userLanguage.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'languageId' },
      });
    });

    it('turns a language deleted meanwhile (P2003) into BAD_USER_INPUT on languageId', async () => {
      prisma.userLanguage.create.mockRejectedValue(prismaError('P2003'));

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'languageId' }] },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');
      prisma.userLanguage.create.mockRejectedValue(error);

      await expect(service.create(OWNER, CREATE_INPUT)).rejects.toBe(error);
    });
  });

  describe('update', () => {
    it("changes only the proficiency of the user's assignment and returns it mapped", async () => {
      prisma.userLanguage.update.mockResolvedValue(userLanguageRow(Proficiency.NATIVE));

      const result = await service.update(OWNER, UPDATE_INPUT);

      expect(prisma.userLanguage.update).toHaveBeenCalledWith({
        where: { id: 'user-language-English', userId: OWNER_ID },
        data: { proficiency: Proficiency.NATIVE },
        include: userLanguageInclude,
      });
      expect(result).toEqual({
        id: 'user-language-English',
        proficiency: Proficiency.NATIVE,
        language: ENGLISH,
      });
    });

    it("rejects another user's profile for an Employee with FORBIDDEN", async () => {
      await expect(service.update(ANOTHER_EMPLOYEE, UPDATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.userLanguage.update).not.toHaveBeenCalled();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.update(ADMIN, UPDATE_INPUT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userLanguage.update).not.toHaveBeenCalled();
    });

    it('leaves a missing or foreign assignment (P2025) to the global filter', async () => {
      const error = prismaError('P2025');
      prisma.userLanguage.update.mockRejectedValue(error);

      await expect(service.update(OWNER, UPDATE_INPUT)).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('deletes the found assignments of the user and returns their ids', async () => {
      prisma.userLanguage.findMany.mockResolvedValue([
        { id: 'user-language-English' },
        { id: 'user-language-German' },
      ]);

      const result = await service.delete(OWNER, DELETE_ARGS);

      expect(prisma.userLanguage.findMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, id: { in: DELETE_ARGS.ids } },
        select: { id: true },
      });
      expect(prisma.userLanguage.deleteMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, id: { in: ['user-language-English', 'user-language-German'] } },
      });
      expect(result).toEqual(['user-language-English', 'user-language-German']);
    });

    it('skips ids that are already removed or belong to another user', async () => {
      prisma.userLanguage.findMany.mockResolvedValue([{ id: 'user-language-English' }]);

      const result = await service.delete(OWNER, DELETE_ARGS);

      expect(prisma.userLanguage.deleteMany).toHaveBeenCalledWith({
        where: { userId: OWNER_ID, id: { in: ['user-language-English'] } },
      });
      expect(result).toEqual(['user-language-English']);
    });

    it("lets an Admin delete another user's assignments", async () => {
      prisma.userLanguage.findMany.mockResolvedValue([{ id: 'user-language-English' }]);

      await expect(service.delete(ADMIN, DELETE_ARGS)).resolves.toEqual(['user-language-English']);
    });

    it("rejects another user's profile for an Employee with FORBIDDEN", async () => {
      await expect(service.delete(ANOTHER_EMPLOYEE, DELETE_ARGS)).rejects.toMatchObject({
        extensions: { code: ErrorCode.FORBIDDEN },
      });
      expect(prisma.userLanguage.findMany).not.toHaveBeenCalled();
      expect(prisma.userLanguage.deleteMany).not.toHaveBeenCalled();
    });

    it('rejects a missing user with NOT_FOUND', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete(ADMIN, DELETE_ARGS)).rejects.toMatchObject({
        extensions: { code: ErrorCode.NOT_FOUND },
      });
      expect(prisma.userLanguage.deleteMany).not.toHaveBeenCalled();
    });
  });
});
