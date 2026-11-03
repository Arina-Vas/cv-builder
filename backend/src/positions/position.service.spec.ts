import { plainToInstance } from 'class-transformer';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import type { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@/generated/prisma/client';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { PositionsArgs } from '@/positions/dto/positions.args';
import { PositionService } from '@/positions/position.service';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const row = (name: string) => ({
  id: `id-${name}`,
  name,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

// Args with the same defaults the ValidationPipe applies
const args = (plain: Partial<PositionsArgs> = {}): PositionsArgs =>
  plainToInstance(PositionsArgs, plain);

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('PositionService', () => {
  const prisma = {
    position: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new PositionService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.position.findMany.mockResolvedValue([row('QA Engineer'), row('Project Manager')]);
    prisma.position.count.mockResolvedValue(2);
  });

  describe('findAll', () => {
    it('loads the first page sorted by name, then id', async () => {
      await service.findAll(args());

      expect(prisma.position.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 10,
      });
      expect(prisma.position.count).toHaveBeenCalledWith({ where: {} });
    });

    it('searches by name case-insensitively in the list and the total', async () => {
      await service.findAll(args({ search: 'engineer' }));

      const where = { name: { contains: 'engineer', mode: 'insensitive' } };
      expect(prisma.position.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.position.count).toHaveBeenCalledWith({ where });
    });

    it('applies the sort order', async () => {
      await service.findAll(args({ sortOrder: SortOrder.DESC }));

      expect(prisma.position.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: 'desc' }, { id: 'asc' }] }),
      );
    });

    it('skips the previous pages', async () => {
      await service.findAll(args({ page: 3, pageSize: 20 }));

      expect(prisma.position.findMany).toHaveBeenCalledWith(
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
          { id: 'id-QA Engineer', name: 'QA Engineer' },
          { id: 'id-Project Manager', name: 'Project Manager' },
        ],
        total: 2,
        page: 2,
        pageSize: 20,
      });
    });
  });

  describe('create', () => {
    it('saves the name and returns the mapped position', async () => {
      prisma.position.create.mockResolvedValue(row('QA Engineer'));

      const result = await service.create({ name: 'QA Engineer' });

      expect(prisma.position.create).toHaveBeenCalledWith({ data: { name: 'QA Engineer' } });
      expect(result).toEqual({ id: 'id-QA Engineer', name: 'QA Engineer' });
    });

    it('turns a duplicate name into CONFLICT on the name field', async () => {
      prisma.position.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create({ name: 'QA Engineer' })).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');
      prisma.position.create.mockRejectedValue(error);

      await expect(service.create({ name: 'QA Engineer' })).rejects.toBe(error);
    });
  });

  describe('update', () => {
    it('saves the new name and returns the mapped position', async () => {
      prisma.position.update.mockResolvedValue({ ...row('QA Engineer New'), id: 'id-QA Engineer' });

      const result = await service.update({ id: 'id-QA Engineer', name: 'QA Engineer New' });

      expect(prisma.position.update).toHaveBeenCalledWith({
        where: { id: 'id-QA Engineer' },
        data: { name: 'QA Engineer New' },
      });
      expect(result).toEqual({ id: 'id-QA Engineer', name: 'QA Engineer New' });
    });

    it('turns a duplicate name into CONFLICT on the name field', async () => {
      prisma.position.update.mockRejectedValue(prismaError('P2002'));

      await expect(
        service.update({ id: 'id-QA Engineer', name: 'QA Engineer New' }),
      ).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');

      prisma.position.update.mockRejectedValue(error);

      await expect(service.update({ id: 'id-QA Engineer', name: 'QA Engineer New' })).rejects.toBe(
        error,
      );
    });
  });

  describe('delete', () => {
    it('deletes the position and returns its id', async () => {
      prisma.position.delete.mockResolvedValue(row('QA Engineer'));

      const result = await service.delete('id-QA Engineer');

      expect(prisma.position.delete).toHaveBeenCalledWith({
        where: { id: 'id-QA Engineer' },
      });
      expect(result).toBe('id-QA Engineer');
    });

    it.each(['P2003', 'P2025'])('leaves %s to the global filter', async (code) => {
      const error = prismaError(code);

      prisma.position.delete.mockRejectedValue(error);

      await expect(service.delete('id-QA Engineer')).rejects.toBe(error);
    });
  });
});
