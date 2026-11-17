import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { Prisma } from '@/generated/prisma/client';
import { LanguagesArgs } from '@/languages/dto/languages.args';
import { LanguageService } from '@/languages/language.service';
import { LanguageSortField } from '@/languages/models/language-sort-field.enum';
import type { PrismaService } from '@/prisma/prisma.service';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const row = (name: string, iso: string, nativeName = name) => ({
  id: `id-${iso}`,
  name,
  iso,
  nativeName,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

const ENGLISH = { name: 'English', iso: 'EN', nativeName: 'English' };

// Args with the same defaults the ValidationPipe applies
const args = (plain: Partial<LanguagesArgs> = {}): LanguagesArgs =>
  plainToInstance(LanguagesArgs, plain);

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('LanguageService', () => {
  const prisma = {
    language: {
      findMany: jest.fn(),
      count: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    userLanguage: {
      count: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new LanguageService(prisma as unknown as PrismaService);

  // Makes findUnique find the given name / ISO code as belonging to the language `ownerId`
  const takenBy = (taken: { name?: string; iso?: string }, ownerId = 'id-OTHER') => {
    prisma.language.findUnique.mockImplementation(
      ({ where }: { where: { name?: string; iso?: string } }) =>
        Promise.resolve(
          (where.name !== undefined && where.name === taken.name) ||
            (where.iso !== undefined && where.iso === taken.iso)
            ? { id: ownerId }
            : null,
        ),
    );
  };

  // Another request saves the same value between the first check and this write: the write fails
  // with P2002, and only from then on the value is found as taken
  const takenDuringWrite = (write: jest.Mock, taken: { name?: string; iso?: string }) => {
    write.mockImplementation(() => {
      takenBy(taken);
      return Promise.reject(prismaError('P2002'));
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // By default nothing references the language, so it can be deleted
    prisma.userLanguage.count.mockResolvedValue(0);
    prisma.language.findMany.mockResolvedValue([
      row('English', 'EN'),
      row('German', 'DE', 'Deutsch'),
    ]);
    prisma.language.count.mockResolvedValue(2);
    takenBy({});
  });

  describe('findAll', () => {
    it('loads the first page sorted by name, then id', async () => {
      await service.findAll(args());

      expect(prisma.language.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 10,
      });
      expect(prisma.language.count).toHaveBeenCalledWith({ where: {} });
    });

    it('searches by name only, case-insensitively, in the list and the total', async () => {
      await service.findAll(args({ search: 'ger' }));

      const where = { name: { contains: 'ger', mode: 'insensitive' } };
      expect(prisma.language.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.language.count).toHaveBeenCalledWith({ where });
    });

    it('sorts by ISO code in the given order', async () => {
      await service.findAll(args({ sortBy: LanguageSortField.iso, sortOrder: SortOrder.DESC }));

      expect(prisma.language.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ iso: 'desc' }, { id: 'asc' }] }),
      );
    });

    it('skips the previous pages', async () => {
      await service.findAll(args({ page: 3, pageSize: 20 }));

      expect(prisma.language.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });

    it('reads the list and the total in one transaction', async () => {
      await service.findAll(args());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('returns mapped items with the page info', async () => {
      const result = await service.findAll(args({ page: 2, pageSize: 20 }));

      expect(result).toEqual({
        items: [
          { id: 'id-EN', name: 'English', iso: 'EN', nativeName: 'English' },
          { id: 'id-DE', name: 'German', iso: 'DE', nativeName: 'Deutsch' },
        ],
        total: 2,
        page: 2,
        pageSize: 20,
      });
    });
  });

  describe('create', () => {
    it('checks the name and the ISO code, saves the language and returns it mapped', async () => {
      prisma.language.create.mockResolvedValue(row('English', 'EN'));

      const result = await service.create(ENGLISH);

      expect(prisma.language.findUnique).toHaveBeenCalledWith({
        where: { name: 'English' },
        select: { id: true },
      });
      expect(prisma.language.findUnique).toHaveBeenCalledWith({
        where: { iso: 'EN' },
        select: { id: true },
      });
      expect(prisma.language.create).toHaveBeenCalledWith({ data: ENGLISH });
      expect(result).toEqual({ id: 'id-EN', ...ENGLISH });
    });

    it('rejects a taken name with CONFLICT on the name field', async () => {
      takenBy({ name: 'English' });

      await expect(service.create(ENGLISH)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
      expect(prisma.language.create).not.toHaveBeenCalled();
    });

    it('rejects a taken ISO code with CONFLICT on the iso field', async () => {
      takenBy({ iso: 'EN' });

      await expect(service.create(ENGLISH)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'iso' },
      });
      expect(prisma.language.create).not.toHaveBeenCalled();
    });

    it('allows a native name that another language already has', async () => {
      prisma.language.create.mockResolvedValue(row('British English', 'EN-GB', 'English'));

      await expect(
        service.create({ name: 'British English', iso: 'EN-GB', nativeName: 'English' }),
      ).resolves.toMatchObject({ nativeName: 'English' });
    });

    it.each(['name', 'iso'] as const)(
      'turns a concurrent duplicate (P2002) into CONFLICT on the %s field',
      async (field) => {
        takenDuringWrite(prisma.language.create, { [field]: ENGLISH[field] });

        await expect(service.create(ENGLISH)).rejects.toMatchObject({
          extensions: { code: ErrorCode.CONFLICT, field },
        });
        // checked before the write and once more after the P2002
        expect(prisma.language.findUnique).toHaveBeenCalledTimes(4);
      },
    );

    it('leaves a P2002 to the global filter when the second check finds no duplicate', async () => {
      const error = prismaError('P2002');
      prisma.language.create.mockRejectedValue(error);

      await expect(service.create(ENGLISH)).rejects.toBe(error);
    });
  });

  describe('update', () => {
    it('saves all fields by id and returns the mapped language', async () => {
      prisma.language.update.mockResolvedValue(row('British English', 'EN-GB', 'English'));

      const result = await service.update({
        id: 'id-EN',
        name: 'British English',
        iso: 'EN-GB',
        nativeName: 'English',
      });

      expect(prisma.language.update).toHaveBeenCalledWith({
        where: { id: 'id-EN' },
        data: { name: 'British English', iso: 'EN-GB', nativeName: 'English' },
      });
      expect(result).toEqual({
        id: 'id-EN-GB',
        name: 'British English',
        iso: 'EN-GB',
        nativeName: 'English',
      });
    });

    it('does not treat the language as a duplicate of itself', async () => {
      takenBy({ name: 'English', iso: 'EN' }, 'id-EN');
      prisma.language.update.mockResolvedValue(row('English', 'EN'));

      await expect(service.update({ id: 'id-EN', ...ENGLISH })).resolves.toMatchObject(ENGLISH);
    });

    it.each(['name', 'iso'] as const)(
      'rejects a %s taken by another language with CONFLICT on that field',
      async (field) => {
        takenBy({ [field]: ENGLISH[field] });

        await expect(service.update({ id: 'id-EN', ...ENGLISH })).rejects.toMatchObject({
          extensions: { code: ErrorCode.CONFLICT, field },
        });
        expect(prisma.language.update).not.toHaveBeenCalled();
      },
    );

    it.each(['name', 'iso'] as const)(
      'turns a concurrent duplicate (P2002) into CONFLICT on the %s field',
      async (field) => {
        takenDuringWrite(prisma.language.update, { [field]: ENGLISH[field] });

        await expect(service.update({ id: 'id-EN', ...ENGLISH })).rejects.toMatchObject({
          extensions: { code: ErrorCode.CONFLICT, field },
        });
      },
    );

    it('leaves a P2002 to the global filter when the second check finds no duplicate', async () => {
      const error = prismaError('P2002');
      prisma.language.update.mockRejectedValue(error);

      await expect(service.update({ id: 'id-EN', ...ENGLISH })).rejects.toBe(error);
    });

    it('leaves a missing language (P2025) to the global filter', async () => {
      const error = prismaError('P2025');
      prisma.language.update.mockRejectedValue(error);

      await expect(service.update({ id: 'id-EN', ...ENGLISH })).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('deletes the language and returns its id when nothing references it', async () => {
      prisma.language.delete.mockResolvedValue(row('English', 'EN'));

      const result = await service.delete('id-EN');

      expect(prisma.userLanguage.count).toHaveBeenCalledWith({ where: { languageId: 'id-EN' } });
      expect(prisma.language.delete).toHaveBeenCalledWith({ where: { id: 'id-EN' } });
      expect(result).toBe('id-EN');
    });

    it('throws ENTITY_IN_USE and does not delete when users reference the language', async () => {
      prisma.userLanguage.count.mockResolvedValue(2);

      await expect(service.delete('id-EN')).rejects.toMatchObject({
        message: 'Language cannot be deleted because it is currently in use',
        extensions: { code: ErrorCode.ENTITY_IN_USE },
      });
      expect(prisma.language.delete).not.toHaveBeenCalled();
    });

    // P2003 here means a reference was added between the check and the delete
    it.each(['P2003', 'P2025'])('leaves %s to the global filter', async (code) => {
      const error = prismaError(code);
      prisma.language.delete.mockRejectedValue(error);

      await expect(service.delete('id-EN')).rejects.toBe(error);
    });
  });
});
