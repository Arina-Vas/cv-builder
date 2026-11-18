import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import { CvAccessService } from '@/cvs/cv-access.service';
import { cvInclude } from '@/cvs/cv.mapper';
import type { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
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
  emailVerifiedAt: CREATED_AT,
  createdAt: CREATED_AT,
});

const OWNER = currentUser(OWNER_ID, UserRole.EMPLOYEE);
const ANOTHER_EMPLOYEE = currentUser('user-2', UserRole.EMPLOYEE);
const ADMIN = currentUser('admin-1', UserRole.ADMIN);

// Only the fields the access check reads matter here
const CV_ROW = { id: CV_ID, userId: OWNER_ID, name: 'Frontend Developer' };

describe('CvAccessService', () => {
  const prisma = { cv: { findUnique: jest.fn() } };
  const service = new CvAccessService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.cv.findUnique.mockResolvedValue(CV_ROW);
  });

  it('loads the CV with its owner', async () => {
    await service.getAccessibleCv(CV_ID, OWNER);

    expect(prisma.cv.findUnique).toHaveBeenCalledWith({
      where: { id: CV_ID },
      include: cvInclude,
    });
  });

  it('returns the own CV to an Employee', async () => {
    await expect(service.getAccessibleCv(CV_ID, OWNER)).resolves.toBe(CV_ROW);
  });

  it('returns any CV to an Admin', async () => {
    await expect(service.getAccessibleCv(CV_ID, ADMIN)).resolves.toBe(CV_ROW);
  });

  it("rejects another user's CV for an Employee with FORBIDDEN", async () => {
    await expect(service.getAccessibleCv(CV_ID, ANOTHER_EMPLOYEE)).rejects.toMatchObject({
      extensions: { code: ErrorCode.FORBIDDEN },
    });
  });

  it.each([
    ['an Employee', OWNER],
    ['an Admin', ADMIN],
  ])('rejects a missing CV with NOT_FOUND for %s', async (_role, user) => {
    prisma.cv.findUnique.mockResolvedValue(null);

    await expect(service.getAccessibleCv(CV_ID, user)).rejects.toMatchObject({
      extensions: { code: ErrorCode.NOT_FOUND },
    });
  });
});
