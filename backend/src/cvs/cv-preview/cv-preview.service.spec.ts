import { ErrorCode } from '@/common/errors/error-code.enum';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { UserRole } from '@/common/graphql/enums';
import type { CvAccessService } from '@/cvs/cv-access.service';
import { cvPreviewInclude } from '@/cvs/cv-preview/cv-preview.mapper';
import { CvPreviewService } from '@/cvs/cv-preview/cv-preview.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService pulls in @nestjs/config (ESM), which Jest cannot load; the test passes its own mock
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));

const CREATED_AT = new Date('2026-01-01T00:00:00.000Z');
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
  emailVerifiedAt: CREATED_AT,
  createdAt: CREATED_AT,
};

const frontend = { id: 'cat-Frontend', name: 'Frontend', type: 'Frontend' };

// A CV with one skill used in one "Till now" CV project, as Prisma returns it with cvPreviewInclude
const previewRow = {
  id: CV_ID,
  name: 'Frontend CV',
  education: 'BSUIR',
  description: 'React developer',
  userId: OWNER_ID,
  user: {
    id: OWNER_ID,
    email: 'owner@example.com',
    firstName: 'Ann',
    lastName: 'Lee',
    avatarKey: null,
    role: UserRole.EMPLOYEE,
    emailVerifiedAt: null,
    createdAt: CREATED_AT,
    department: null,
    position: null,
    languages: [],
  },
  skills: [
    {
      id: 'cv-skill-React',
      skillId: 'skill-React',
      skill: { id: 'skill-React', name: 'React', category: frontend },
    },
  ],
  projects: [
    {
      id: 'cv-project-1',
      startDate: new Date('2023-06-01T00:00:00.000Z'),
      endDate: null,
      responsibilities: null,
      roles: [],
      project: {
        id: 'project-1',
        name: 'Shop',
        domain: 'E-commerce',
        description: 'Online shop',
        startDate: new Date('2020-01-01T00:00:00.000Z'),
        endDate: new Date('2030-01-01T00:00:00.000Z'),
        technologies: [
          {
            skillId: 'skill-React',
            skill: { id: 'skill-React', name: 'React', category: frontend },
          },
        ],
      },
    },
  ],
};

describe('CvPreviewService', () => {
  const prisma = { cv: { findUnique: jest.fn() } };
  const cvAccess = { getAccessibleCv: jest.fn() };
  const service = new CvPreviewService(
    prisma as unknown as PrismaService,
    cvAccess as unknown as CvAccessService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    cvAccess.getAccessibleCv.mockResolvedValue({ id: CV_ID, userId: OWNER_ID });
    prisma.cv.findUnique.mockResolvedValue(previewRow);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('checks the CV against the current user, then loads it with the owner filter', async () => {
    await service.getPreview(ADMIN, CV_ID);

    expect(cvAccess.getAccessibleCv).toHaveBeenCalledWith(CV_ID, ADMIN);
    expect(prisma.cv.findUnique).toHaveBeenCalledWith({
      where: { id: CV_ID },
      include: cvPreviewInclude(OWNER_ID),
    });
  });

  it('counts experience up to the current date', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-24T12:00:00.000Z') });

    const preview = await service.getPreview(ADMIN, CV_ID);

    expect(preview).toMatchObject({
      id: CV_ID,
      domains: ['E-commerce'],
      skillGroups: [
        {
          category: frontend,
          skills: [{ skill: { name: 'React' }, experienceYears: 3, lastUsedYear: 2026 }],
        },
      ],
    });
  });

  it.each([
    ['NOT_FOUND for a missing CV', notFound('CV not found'), ErrorCode.NOT_FOUND],
    ["FORBIDDEN for another user's CV", forbidden(), ErrorCode.FORBIDDEN],
  ])('fails with %s and reads nothing else', async (_case, error, code) => {
    cvAccess.getAccessibleCv.mockRejectedValue(error);

    await expect(service.getPreview(ADMIN, CV_ID)).rejects.toMatchObject({ extensions: { code } });
    expect(prisma.cv.findUnique).not.toHaveBeenCalled();
  });

  it('fails with NOT_FOUND when the CV is deleted after the access check', async () => {
    prisma.cv.findUnique.mockResolvedValue(null);

    await expect(service.getPreview(ADMIN, CV_ID)).rejects.toMatchObject({
      message: 'CV not found',
      extensions: { code: ErrorCode.NOT_FOUND },
    });
  });
});
