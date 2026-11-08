import { Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import type { GraphQLError } from 'graphql';
import { verifyPassword } from '@/common/crypto/password';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { Prisma } from '@/generated/prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type { CreateUserInput } from './dto/create-user.input';
import type { UpdateUserInput } from './dto/update-user.input';
import { UsersArgs } from './dto/users.args';
import { UserSortField } from './models/user-sort-field.enum';
import { userInclude, type UserWithRelations } from './user.mapper';
import { UserMessage } from './user.messages';
import { UsersService } from './users.service';

// The real PrismaService pulls in @nestjs/config, which is ESM-only and cannot be loaded by Jest
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: UserWithRelations = {
  id: 'user-1',
  email: 'employee@cv-builder.local',
  emailVerifiedAt: null,
  passwordHash: 'secret-hash',
  firstName: null,
  lastName: null,
  role: UserRole.EMPLOYEE,
  avatarUrl: null,
  departmentId: null,
  department: null,
  positionId: null,
  position: null,
  createdAt,
  updatedAt: createdAt,
};

// Args with the same defaults the ValidationPipe applies
const args = (plain: Partial<UsersArgs> = {}): UsersArgs => plainToInstance(UsersArgs, plain);

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Prisma error', { code, clientVersion: 'test' });

const catchError = (promise: Promise<unknown>): Promise<GraphQLError> =>
  promise.then(
    () => {
      throw new Error('expected the promise to reject');
    },
    (error: GraphQLError) => error,
  );

const createInput: CreateUserInput = {
  email: 'new@cv-builder.local',
  password: 'secret123',
  firstName: 'Anna',
  lastName: 'Kovalenko',
  departmentId: 'department-1',
  positionId: 'position-1',
  role: UserRole.EMPLOYEE,
};

const updateInput = (role: UserRole = UserRole.EMPLOYEE): UpdateUserInput => ({
  id: 'user-1',
  departmentId: 'department-1',
  positionId: 'position-1',
  role,
});

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    department: { findUnique: jest.fn() },
    position: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  let service: UsersService;

  beforeEach(async () => {
    // Array form (findAll) runs the operations; callback form (update, delete) gets the same mock as the client
    prisma.$transaction.mockImplementation((arg: unknown) =>
      typeof arg === 'function'
        ? (arg as (tx: typeof prisma) => Promise<unknown>)(prisma)
        : Promise.all(arg as Promise<unknown>[]),
    );
    prisma.department.findUnique.mockResolvedValue({ id: 'department-1' });
    prisma.position.findUnique.mockResolvedValue({ id: 'position-1' });

    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findAll', () => {
    beforeEach(() => {
      prisma.user.findMany.mockResolvedValue([row]);
      prisma.user.count.mockResolvedValue(1);
    });

    it('returns the first page in creation order when no sort field is given', async () => {
      const result = await service.findAll(args());

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: {},
        include: userInclude,
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        skip: 0,
        take: 10,
      });
      expect(prisma.user.count).toHaveBeenCalledWith({ where: {} });
      expect(result).toMatchObject({ page: 1, pageSize: 10, total: 1 });
      expect(result.items[0]).not.toHaveProperty('passwordHash');
    });

    it('ignores the sort order without a sort field', async () => {
      await service.findAll(args({ sortOrder: SortOrder.DESC }));

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [{ createdAt: 'asc' }, { id: 'asc' }] }),
      );
    });

    it('searches first name, last name and email case-insensitively in the list and the total', async () => {
      await service.findAll(args({ search: 'ann' }));

      const where = {
        OR: [
          { firstName: { contains: 'ann', mode: 'insensitive' } },
          { lastName: { contains: 'ann', mode: 'insensitive' } },
          { email: { contains: 'ann', mode: 'insensitive' } },
        ],
      };
      expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({ where }));
      expect(prisma.user.count).toHaveBeenCalledWith({ where });
    });

    it.each([
      [UserSortField.firstName, { firstName: { sort: 'desc', nulls: 'last' } }],
      [UserSortField.lastName, { lastName: { sort: 'desc', nulls: 'last' } }],
      [UserSortField.department, { department: { name: 'desc' } }],
      [UserSortField.position, { position: { name: 'desc' } }],
    ])('sorts by %s, then id', async (sortBy, first) => {
      await service.findAll(args({ sortBy, sortOrder: SortOrder.DESC }));

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: [first, { id: 'asc' }] }),
      );
    });

    it('skips the previous pages', async () => {
      await service.findAll(args({ page: 3, pageSize: 20 }));

      expect(prisma.user.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 40, take: 20 }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the user', async () => {
      prisma.user.findUnique.mockResolvedValue(row);

      await expect(service.findOne('user-1')).resolves.toMatchObject({ id: 'user-1' });
    });

    it('fails with NOT_FOUND when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const error = await catchError(service.findOne('missing'));

      expect(error.extensions['code']).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe(UserMessage.notFound);
    });
  });

  describe('createUser', () => {
    it('stores a hash instead of the password and maps the user without it', async () => {
      prisma.user.create.mockResolvedValue(row);

      const user = await service.createUser(createInput);

      const { password, ...data } = createInput;
      const [[{ data: stored }]] = prisma.user.create.mock.calls as [
        [{ data: Prisma.UserCreateInput }],
      ];
      expect(stored).toEqual({ ...data, passwordHash: expect.any(String) });
      expect(stored).not.toHaveProperty('password');
      await expect(verifyPassword(stored.passwordHash, password)).resolves.toBe(true);
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('creates the user unverified (database default)', async () => {
      prisma.user.create.mockResolvedValue(row);

      await service.createUser(createInput);

      const [[{ data: stored }]] = prisma.user.create.mock.calls as [[{ data: object }]];
      expect(stored).not.toHaveProperty('emailVerifiedAt');
    });

    it('fails with CONFLICT on the email when it is taken', async () => {
      prisma.user.create.mockRejectedValue(prismaError('P2002'));

      const error = await catchError(service.createUser(createInput));

      expect(error.extensions).toMatchObject({ code: ErrorCode.CONFLICT, field: 'email' });
      expect(error.message).toBe(UserMessage.emailTaken);
    });

    it('rethrows other database errors', async () => {
      const failure = prismaError('P2025');
      prisma.user.create.mockRejectedValue(failure);

      await expect(service.createUser(createInput)).rejects.toBe(failure);
    });

    it('fails with BAD_USER_INPUT for each missing department or position, without creating', async () => {
      prisma.department.findUnique.mockResolvedValue(null);
      prisma.position.findUnique.mockResolvedValue(null);

      const error = await catchError(service.createUser(createInput));

      expect(error.extensions['code']).toBe(ErrorCode.BAD_USER_INPUT);
      expect(error.extensions['fields']).toEqual([
        { field: 'departmentId', message: UserMessage.departmentNotFound },
        { field: 'positionId', message: UserMessage.positionNotFound },
      ]);
      expect(prisma.user.create).not.toHaveBeenCalled();
    });

    it('reports only the missing position', async () => {
      prisma.position.findUnique.mockResolvedValue(null);

      const error = await catchError(service.createUser(createInput));

      expect(error.extensions['fields']).toEqual([
        { field: 'positionId', message: UserMessage.positionNotFound },
      ]);
    });
  });

  describe('update', () => {
    beforeEach(() => {
      prisma.user.update.mockResolvedValue(row);
    });

    it('updates department, position and role in a serializable transaction', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.EMPLOYEE });

      const user = await service.update(updateInput(UserRole.ADMIN), 'admin-1');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { departmentId: 'department-1', positionId: 'position-1', role: UserRole.ADMIN },
        include: userInclude,
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      });
      expect(user).toMatchObject({ id: 'user-1' });
    });

    it('lets an admin update their own department and position while the role stays', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });

      await service.update({ ...updateInput(UserRole.ADMIN), id: 'admin-1' }, 'admin-1');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(prisma.user.count).not.toHaveBeenCalled();
    });

    it('fails with NOT_FOUND when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const error = await catchError(service.update(updateInput(), 'admin-1'));

      expect(error.extensions['code']).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe(UserMessage.notFound);
    });

    it('fails with OPERATION_NOT_ALLOWED when changing own role', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });

      const error = await catchError(
        service.update({ ...updateInput(UserRole.EMPLOYEE), id: 'admin-1' }, 'admin-1'),
      );

      expect(error.extensions['code']).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
      expect(error.message).toBe(UserMessage.ownRoleChange);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('fails with OPERATION_NOT_ALLOWED when demoting the last admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });
      prisma.user.count.mockResolvedValue(1);

      const error = await catchError(service.update(updateInput(UserRole.EMPLOYEE), 'admin-1'));

      expect(prisma.user.count).toHaveBeenCalledWith({ where: { role: UserRole.ADMIN } });
      expect(error.extensions['code']).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
      expect(error.message).toBe(UserMessage.lastAdminDemote);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('demotes an admin while another admin remains', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });
      prisma.user.count.mockResolvedValue(2);

      await service.update(updateInput(UserRole.EMPLOYEE), 'admin-1');

      expect(prisma.user.update).toHaveBeenCalled();
    });

    it('checks the department and position before the transaction', async () => {
      prisma.department.findUnique.mockResolvedValue(null);

      const error = await catchError(service.update(updateInput(), 'admin-1'));

      expect(error.extensions['code']).toBe(ErrorCode.BAD_USER_INPUT);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('deletes the user in a serializable transaction and returns its id', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.EMPLOYEE });

      await expect(service.delete('user-1', 'admin-1')).resolves.toBe('user-1');

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'user-1' } });
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        isolationLevel: 'Serializable',
      });
    });

    it('fails with OPERATION_NOT_ALLOWED when deleting own account, without a query', async () => {
      const error = await catchError(service.delete('admin-1', 'admin-1'));

      expect(error.extensions['code']).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
      expect(error.message).toBe(UserMessage.ownAccountDelete);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('fails with NOT_FOUND when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const error = await catchError(service.delete('missing', 'admin-1'));

      expect(error.extensions['code']).toBe(ErrorCode.NOT_FOUND);
      expect(error.message).toBe(UserMessage.notFound);
    });

    it('fails with OPERATION_NOT_ALLOWED when deleting the last admin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });
      prisma.user.count.mockResolvedValue(1);

      const error = await catchError(service.delete('admin-2', 'admin-1'));

      expect(error.extensions['code']).toBe(ErrorCode.OPERATION_NOT_ALLOWED);
      expect(error.message).toBe(UserMessage.lastAdminDelete);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes an admin while another admin remains', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: UserRole.ADMIN });
      prisma.user.count.mockResolvedValue(2);

      await expect(service.delete('admin-2', 'admin-1')).resolves.toBe('admin-2');
    });
  });

  describe('findById', () => {
    it('loads the user with relations and maps it without the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue(row);

      const user = await service.findById('user-1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: userInclude,
      });
      expect(user).toMatchObject({ id: 'user-1', email: row.email, role: UserRole.EMPLOYEE });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('returns null when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findById('missing')).resolves.toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('looks the user up by email and maps it without the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue(row);

      const user = await service.findByEmail(row.email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: row.email },
        include: userInclude,
      });
      expect(user).not.toHaveProperty('passwordHash');
    });

    it('returns null when the email is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.findByEmail('nobody@cv-builder.local')).resolves.toBeNull();
    });
  });

  describe('create', () => {
    it('creates the user with only email and password hash and maps the result', async () => {
      prisma.user.create.mockResolvedValue(row);
      const data = { email: row.email, passwordHash: 'secret-hash' };

      const user = await service.create(data);

      // role and verification status come from the database defaults
      expect(prisma.user.create).toHaveBeenCalledWith({ data, include: userInclude });
      expect(user).toMatchObject({ id: 'user-1', role: UserRole.EMPLOYEE, emailVerifiedAt: null });
      expect(user).not.toHaveProperty('passwordHash');
    });
  });

  describe('findWithPasswordHashByEmail', () => {
    it('selects only the id and the password hash', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 'user-1', passwordHash: 'secret-hash' });

      const credentials = await service.findWithPasswordHashByEmail(row.email);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: row.email },
        select: { id: true, passwordHash: true },
      });
      expect(credentials).toEqual({ id: 'user-1', passwordHash: 'secret-hash' });
    });

    it('returns null when the email is not registered', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.findWithPasswordHashByEmail('nobody@cv-builder.local'),
      ).resolves.toBeNull();
    });
  });
});
