import { Test } from '@nestjs/testing';
import { UserRole } from '@/common/graphql/enums';
import { PrismaService } from '@/prisma/prisma.service';
import { userInclude, type UserWithRelations } from './user.mapper';
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

describe('UsersService', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  let service: UsersService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [UsersService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  afterEach(() => {
    jest.resetAllMocks();
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
