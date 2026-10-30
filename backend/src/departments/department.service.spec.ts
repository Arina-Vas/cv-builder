import { plainToInstance } from 'class-transformer';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import type { PrismaService } from '@/prisma/prisma.service';
import { DepartmentService } from './department.service';
import { DepartmentsArgs } from './dto/departments.args';
import { Prisma } from '@/generated/prisma/client';
import { ErrorCode } from '@/common/errors/error-code.enum';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const row = (name: string) => ({
  id: `id-${name}`,
  name,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
});

// Args with the same defaults the ValidationPipe applies
const args = (plain: Partial<DepartmentsArgs> = {}): DepartmentsArgs =>
  plainToInstance(DepartmentsArgs, plain);

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

describe('DepartmentService', () => {
  const prisma = {
    department: {
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new DepartmentService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.department.findMany.mockResolvedValue([row('Backend'), row('Frontend')]);
    prisma.department.count.mockResolvedValue(2);
  });

  describe('findAll', () => {
    it('loads the first page sorted by name, then id', async () => {
      await service.findAll(args());

      expect(prisma.department.findMany).toHaveBeenCalledWith({
        where: {},
        orderBy: [{ name: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 10,
      });
      expect(prisma.department.count).toHaveBeenCalledWith({ where: {} });
    });

    it('searches by name case-insensitively in the list and the total', async () => {
      await service.findAll(args({ search: 'end' }));

      const where = { name: { contains: 'end', mode: 'insensitive' } };
      expect(prisma.department.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.department.count).toHaveBeenCalledWith({ where });
    });

    it('applies the sort order', async () => {
      await service.findAll(args({ sortOrder: SortOrder.DESC }));

      expect(prisma.department.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ name: 'desc' }, { id: 'asc' }] }),
      );
    });

    it('skips the previous pages', async () => {
      await service.findAll(args({ page: 3, pageSize: 20 }));

      expect(prisma.department.findMany).toHaveBeenCalledWith(
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
          { id: 'id-Backend', name: 'Backend' },
          { id: 'id-Frontend', name: 'Frontend' },
        ],
        total: 2,
        page: 2,
        pageSize: 20,
      });
    });
  });

  describe('create', () => {
    it('saves the name and returns the mapped department', async () => {
      prisma.department.create.mockResolvedValue(row('Sales'));

      const result = await service.create({ name: 'Sales' });

      expect(prisma.department.create).toHaveBeenCalledWith({ data: { name: 'Sales' } });
      expect(result).toEqual({ id: 'id-Sales', name: 'Sales' });
    });

    it('turns a duplicate name into CONFLICT on the name field', async () => {
      prisma.department.create.mockRejectedValue(prismaError('P2002'));

      await expect(service.create({ name: 'Sales' })).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');
      prisma.department.create.mockRejectedValue(error);

      await expect(service.create({ name: 'Sales' })).rejects.toBe(error);
    });
  });

  describe('update', () => {
    it('saves the new name and returns the mapped department', async () => {
      prisma.department.update.mockResolvedValue({ ...row('Sales New'), id: 'id-Sales' });

      const result = await service.update({ id: 'id-Sales', name: 'Sales New' });

      expect(prisma.department.update).toHaveBeenCalledWith({
        where: { id: 'id-Sales' },
        data: { name: 'Sales New' },
      });
      expect(result).toEqual({ id: 'id-Sales', name: 'Sales New' });
    });

    it('turns a duplicate name into CONFLICT on the name field', async () => {
      prisma.department.update.mockRejectedValue(prismaError('P2002'));

      await expect(service.update({ id: 'id-Sales', name: 'Sales New' })).rejects.toMatchObject({
        extensions: { code: ErrorCode.CONFLICT, field: 'name' },
      });
    });

    it('rethrows other errors for the global filter', async () => {
      const error = new Error('connection lost');

      prisma.department.update.mockRejectedValue(error);

      await expect(service.update({ id: 'id-Sales', name: 'Sales New' })).rejects.toBe(error);
    });
  });

  describe('delete', () => {
    it('deletes the department and returns its id', async () => {
      prisma.department.delete.mockResolvedValue(row('Sales'));

      const result = await service.delete('id-Sales');

      expect(prisma.department.delete).toHaveBeenCalledWith({
        where: { id: 'id-Sales' },
      });
      expect(result).toBe('id-Sales');
    });

    it.each(['P2003', 'P2025'])('leaves %s to the global filter', async (code) => {
      const error = prismaError(code);

      prisma.department.delete.mockRejectedValue(error);

      await expect(service.delete('id-Sales')).rejects.toBe(error);
    });
  });
});
