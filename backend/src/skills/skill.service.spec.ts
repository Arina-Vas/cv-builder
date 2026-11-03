import { plainToInstance } from 'class-transformer';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { Prisma } from '@/generated/prisma/client';
import type { PrismaService } from '@/prisma/prisma.service';
import { SkillsArgs } from '@/skills/dto/skills.args';
import { skillInclude } from '@/skills/skill.mapper';
import { SkillService } from '@/skills/skill.service';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const TIMESTAMPS = {
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

const categoryRow = (name: string, type: string) => ({
  id: `cat-${name}`,
  name,
  type,
  ...TIMESTAMPS,
});

// A skill row as Prisma returns it with `include: skillInclude`
const skillRow = (name: string, category = categoryRow('Frontend', 'Frontend')) => ({
  id: `id-${name}`,
  name,
  categoryId: category.id,
  category,
  ...TIMESTAMPS,
});

const FRONTEND = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' };
const REACT = { name: 'React', categoryId: 'cat-Frontend' };

// Args with the same defaults the ValidationPipe applies
const args = (plain: Partial<SkillsArgs> = {}): SkillsArgs => plainToInstance(SkillsArgs, plain);

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('SkillService', () => {
  const prisma = {
    skill: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    skillCategory: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new SkillService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.skill.findMany.mockResolvedValue([skillRow('Angular'), skillRow('React')]);
    prisma.skill.count.mockResolvedValue(2);
    // By default the selected category exists
    prisma.skillCategory.findUnique.mockResolvedValue(categoryRow('Frontend', 'Frontend'));
  });

  describe('findAll', () => {
    it('loads the first page with categories, sorted by name, then id', async () => {
      await service.findAll(args());

      expect(prisma.skill.findMany).toHaveBeenCalledWith({
        include: skillInclude,
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 10,
      });
      expect(prisma.skill.count).toHaveBeenCalledWith({ where: {} });
    });

    it('searches by name case-insensitively in the list and the total', async () => {
      await service.findAll(args({ search: 'script' }));

      const where = { name: { contains: 'script', mode: 'insensitive' } };
      expect(prisma.skill.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.skill.count).toHaveBeenCalledWith({ where });
    });

    it('applies the sort order', async () => {
      await service.findAll(args({ sortOrder: SortOrder.DESC }));

      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: 'desc' }, { id: 'asc' }] }),
      );
    });

    it('skips the previous pages', async () => {
      await service.findAll(args({ page: 3, pageSize: 20 }));

      expect(prisma.skill.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });

    it('reads the list and the total in one transaction', async () => {
      await service.findAll(args());

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('returns mapped skills with their category and the page info', async () => {
      const result = await service.findAll(args({ page: 2, pageSize: 20 }));

      expect(result).toEqual({
        items: [
          { id: 'id-Angular', name: 'Angular', category: FRONTEND },
          { id: 'id-React', name: 'React', category: FRONTEND },
        ],
        total: 2,
        page: 2,
        pageSize: 20,
      });
    });
  });

  describe('findCategories', () => {
    it('returns all categories sorted by name, then id', async () => {
      prisma.skillCategory.findMany.mockResolvedValue([
        categoryRow('Databases', 'Backend'),
        categoryRow('Frontend', 'Frontend'),
      ]);

      const result = await service.findCategories();

      expect(prisma.skillCategory.findMany).toHaveBeenCalledWith({
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
      });
      expect(result).toEqual([
        { id: 'cat-Databases', name: 'Databases', type: 'Backend' },
        FRONTEND,
      ]);
    });
  });

  describe('create', () => {
    it('saves the skill with its category and returns it mapped', async () => {
      prisma.skill.create.mockResolvedValue(skillRow('React'));

      const result = await service.create(REACT);

      expect(prisma.skillCategory.findUnique).toHaveBeenCalledWith({
        where: { id: 'cat-Frontend' },
      });
      expect(prisma.skill.create).toHaveBeenCalledWith({
        data: { name: 'React', categoryId: 'cat-Frontend' },
        include: skillInclude,
      });
      expect(result).toEqual({ id: 'id-React', name: 'React', category: FRONTEND });
    });

    it('rejects a missing category with BAD_USER_INPUT on categoryId', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(null);

      await expect(service.create(REACT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'categoryId' }] },
      });
      expect(prisma.skill.create).not.toHaveBeenCalled();
    });

    it('turns a duplicate name into CONFLICT on the name field', async () => {
      prisma.skill.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create(REACT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
    });

    it('turns a category deleted meanwhile (P2003) into BAD_USER_INPUT on categoryId', async () => {
      prisma.skill.create.mockRejectedValue(prismaError('P2003'));

      await expect(service.create(REACT)).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'categoryId' }] },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');
      prisma.skill.create.mockRejectedValue(error);

      await expect(service.create(REACT)).rejects.toBe(error);
    });
  });

  describe('update', () => {
    const DATABASES = categoryRow('Databases', 'Backend');

    it('saves the name and the category by id and returns the skill mapped', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(DATABASES);
      prisma.skill.update.mockResolvedValue({
        ...skillRow('PostgreSQL', DATABASES),
        id: 'id-Postgres',
      });

      const result = await service.update({
        id: 'id-Postgres',
        name: 'PostgreSQL',
        categoryId: 'cat-Databases',
      });

      expect(prisma.skill.update).toHaveBeenCalledWith({
        where: { id: 'id-Postgres' },
        data: { name: 'PostgreSQL', categoryId: 'cat-Databases' },
        include: skillInclude,
      });
      expect(result).toEqual({
        id: 'id-Postgres',
        name: 'PostgreSQL',
        category: { id: 'cat-Databases', name: 'Databases', type: 'Backend' },
      });
    });

    it('rejects a missing category with BAD_USER_INPUT on categoryId', async () => {
      prisma.skillCategory.findUnique.mockResolvedValue(null);

      await expect(service.update({ id: 'id-React', ...REACT })).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'categoryId' }] },
      });
      expect(prisma.skill.update).not.toHaveBeenCalled();
    });

    it('turns a duplicate name into CONFLICT on the name field', async () => {
      prisma.skill.update.mockRejectedValue(prismaError('P2002'));

      await expect(service.update({ id: 'id-React', ...REACT })).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
    });

    it('turns a category deleted meanwhile (P2003) into BAD_USER_INPUT on categoryId', async () => {
      prisma.skill.update.mockRejectedValue(prismaError('P2003'));

      await expect(service.update({ id: 'id-React', ...REACT })).rejects.toMatchObject({
        extensions: { code: ErrorCode.BAD_USER_INPUT, fields: [{ field: 'categoryId' }] },
      });
    });

    it('leaves a missing skill (P2025) to the global filter', async () => {
      const error = prismaError('P2025');
      prisma.skill.update.mockRejectedValue(error);

      await expect(service.update({ id: 'id-React', ...REACT })).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('deletes the skill and returns its id', async () => {
      prisma.skill.delete.mockResolvedValue(skillRow('React'));

      const result = await service.delete('id-React');

      expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: 'id-React' } });
      expect(result).toBe('id-React');
    });

    it.each(['P2003', 'P2025'])('leaves %s to the global filter', async (code) => {
      const error = prismaError(code);
      prisma.skill.delete.mockRejectedValue(error);

      await expect(service.delete('id-React')).rejects.toBe(error);
    });
  });
});
