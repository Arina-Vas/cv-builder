import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@/config/env.validation';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { UserRole } from '@/common/graphql/enums';
import type { CvAccessService } from '@/cvs/cv-access.service';
import type { CvWithUser } from '@/cvs/cv.mapper';
import { CvPdfService } from '@/cvs/cv-pdf/cv-pdf.service';
import type { User } from '@/users/models/user.model';

// The real PrismaService and @nestjs/config are ESM-only for Jest; the test passes its own mocks
jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class {} }));

// Chromium is never started: launch returns a fake browser with a fake page
const mockLaunch = jest.fn();
jest.mock('puppeteer', () => ({
  __esModule: true,
  default: { launch: (...args: unknown[]): unknown => mockLaunch(...args) },
}));

const PDF_BYTES = new TextEncoder().encode('%PDF-test');
const CV_ID = 'cv-1';
const TIMESTAMP = new Date('2026-01-01T00:00:00.000Z');

const OWNER: User = {
  id: 'user-1',
  email: 'user-1@example.com',
  firstName: 'Anna',
  lastName: 'Smith',
  avatarKey: null,
  role: UserRole.EMPLOYEE,
  position: null,
  department: null,
  emailVerifiedAt: TIMESTAMP,
  createdAt: TIMESTAMP,
};

// A CV row as CvAccessService returns it
const cvRow: CvWithUser = {
  id: CV_ID,
  name: 'Frontend Developer',
  education: 'BSUIR',
  description: 'Five years of web development',
  userId: OWNER.id,
  user: {
    id: OWNER.id,
    email: OWNER.email,
    emailVerifiedAt: TIMESTAMP,
    passwordHash: 'secret-hash',
    firstName: 'Anna',
    lastName: 'Smith',
    role: UserRole.EMPLOYEE,
    avatarKey: null,
    departmentId: null,
    department: null,
    positionId: null,
    position: null,
    createdAt: TIMESTAMP,
    updatedAt: TIMESTAMP,
  },
  createdAt: TIMESTAMP,
  updatedAt: TIMESTAMP,
};

const createPage = () => ({
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(PDF_BYTES),
  close: jest.fn().mockResolvedValue(undefined),
});

describe('CvPdfService', () => {
  let page: ReturnType<typeof createPage>;
  let browser: { newPage: jest.Mock; close: jest.Mock };
  let cvAccess: { getAccessibleCv: jest.Mock };
  let config: { get: jest.Mock };
  let service: CvPdfService;

  beforeEach(() => {
    jest.clearAllMocks();
    page = createPage();
    browser = { newPage: jest.fn().mockResolvedValue(page), close: jest.fn() };
    mockLaunch.mockResolvedValue(browser);
    cvAccess = { getAccessibleCv: jest.fn().mockResolvedValue(cvRow) };
    config = { get: jest.fn().mockReturnValue(false) };
    // A new service per test, so the cached browser never leaks between tests
    service = new CvPdfService(
      cvAccess as unknown as CvAccessService,
      config as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  describe('generate', () => {
    it('renders the accessible CV to an A4 PDF and returns it as base64 with the file name', async () => {
      const result = await service.generate(CV_ID, OWNER);

      expect(cvAccess.getAccessibleCv).toHaveBeenCalledWith(CV_ID, OWNER);
      expect(page.setContent).toHaveBeenCalledWith(expect.stringContaining('Frontend Developer'), {
        waitUntil: 'load',
      });
      expect(page.pdf).toHaveBeenCalledWith({ format: 'A4', printBackground: true });
      expect(result).toEqual({
        fileName: 'frontend-developer.pdf',
        content: Buffer.from(PDF_BYTES).toString('base64'),
      });
      expect(Buffer.from(result.content, 'base64').toString()).toBe('%PDF-test');
    });

    it('closes the page after the PDF is built', async () => {
      await service.generate(CV_ID, OWNER);

      expect(page.close).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['FORBIDDEN', forbidden()],
      ['NOT_FOUND', notFound('CV not found')],
    ])('fails with %s before starting Chromium', async (_, error) => {
      cvAccess.getAccessibleCv.mockRejectedValue(error);

      await expect(service.generate(CV_ID, OWNER)).rejects.toBe(error);
      expect(mockLaunch).not.toHaveBeenCalled();
    });

    it('closes the page and passes the error on when rendering fails', async () => {
      const error = new Error('Navigation timeout');
      page.pdf.mockRejectedValue(error);

      await expect(service.generate(CV_ID, OWNER)).rejects.toBe(error);
      expect(page.close).toHaveBeenCalledTimes(1);
    });

    it.todo('rejects incomplete preview data with BAD_USER_INPUT before rendering (B7)');
  });

  describe('browser', () => {
    it('starts Chromium once and opens a new page for every PDF', async () => {
      await service.generate(CV_ID, OWNER);
      await service.generate(CV_ID, OWNER);

      expect(mockLaunch).toHaveBeenCalledTimes(1);
      expect(browser.newPage).toHaveBeenCalledTimes(2);
    });

    it('starts Chromium once for parallel requests', async () => {
      await Promise.all([service.generate(CV_ID, OWNER), service.generate(CV_ID, OWNER)]);

      expect(mockLaunch).toHaveBeenCalledTimes(1);
    });

    it('starts the headless shell with the sandbox by default', async () => {
      await service.generate(CV_ID, OWNER);

      expect(config.get).toHaveBeenCalledWith('PUPPETEER_NO_SANDBOX', { infer: true });
      expect(mockLaunch).toHaveBeenCalledWith({ headless: 'shell', args: [] });
    });

    it('turns the sandbox off when PUPPETEER_NO_SANDBOX is set', async () => {
      config.get.mockReturnValue(true);

      await service.generate(CV_ID, OWNER);

      expect(mockLaunch).toHaveBeenCalledWith({ headless: 'shell', args: ['--no-sandbox'] });
    });
  });

  describe('onModuleDestroy', () => {
    it('closes the started browser', async () => {
      await service.generate(CV_ID, OWNER);

      await service.onModuleDestroy();

      expect(browser.close).toHaveBeenCalledTimes(1);
    });

    it('does nothing when no PDF was built', async () => {
      await service.onModuleDestroy();

      expect(mockLaunch).not.toHaveBeenCalled();
      expect(browser.close).not.toHaveBeenCalled();
    });
  });
});
