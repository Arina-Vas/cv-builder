import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '@/config/env.validation';
import { forbidden, notFound } from '@/common/errors/app-errors';
import { Locale } from '@/common/graphql/locale.enum';
import { CvPdfService } from '@/cvs/cv-pdf/cv-pdf.service';
import type { CvPreviewService } from '@/cvs/cv-preview/cv-preview.service';
import { cvPreviewFixture, userFixture } from './cv-pdf.fixtures';

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
const INPUT = { cvId: CV_ID, locale: Locale.en };
const OWNER = userFixture();

// What CvPreviewService returns for the CV: owner, languages, skills and a project
const preview = cvPreviewFixture({ id: CV_ID, name: 'Frontend Developer' });

const createPage = () => ({
  setContent: jest.fn().mockResolvedValue(undefined),
  pdf: jest.fn().mockResolvedValue(PDF_BYTES),
  close: jest.fn().mockResolvedValue(undefined),
});

describe('CvPdfService', () => {
  let page: ReturnType<typeof createPage>;
  let browser: { newPage: jest.Mock; close: jest.Mock };
  let cvPreview: { getPreview: jest.Mock };
  let config: { get: jest.Mock };
  let service: CvPdfService;

  beforeEach(() => {
    jest.clearAllMocks();
    page = createPage();
    browser = { newPage: jest.fn().mockResolvedValue(page), close: jest.fn() };
    mockLaunch.mockResolvedValue(browser);
    cvPreview = { getPreview: jest.fn().mockResolvedValue(preview) };
    config = { get: jest.fn().mockReturnValue(false) };
    // A new service per test, so the cached browser never leaks between tests
    service = new CvPdfService(
      cvPreview as unknown as CvPreviewService,
      config as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  describe('generate', () => {
    it('renders the CV preview to an A4 PDF and returns it as base64 with the file name', async () => {
      const result = await service.generate(INPUT, OWNER);

      expect(cvPreview.getPreview).toHaveBeenCalledWith(OWNER, CV_ID);
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

    it('puts the preview data into the document: languages, skills and projects', async () => {
      await service.generate(INPUT, OWNER);

      const [html] = page.setContent.mock.calls[0] as [string];
      expect(html).toContain('Russian — Native');
      expect(html).toContain('<td class="skills__skill">React</td>');
      expect(html).toContain('ShopWave');
    });

    it('renders the document in the requested locale', async () => {
      await service.generate({ cvId: CV_ID, locale: Locale.ru }, OWNER);

      const [html] = page.setContent.mock.calls[0] as [string];
      expect(html).toContain('<html lang="ru">');
      expect(html).toContain('Образование');
      expect(html).not.toContain('Education');
    });

    it('closes the page after the PDF is built', async () => {
      await service.generate(INPUT, OWNER);

      expect(page.close).toHaveBeenCalledTimes(1);
    });

    it.each([
      ['FORBIDDEN', forbidden()],
      ['NOT_FOUND', notFound('CV not found')],
    ])('fails with %s before starting Chromium', async (_, error) => {
      cvPreview.getPreview.mockRejectedValue(error);

      await expect(service.generate(INPUT, OWNER)).rejects.toBe(error);
      expect(mockLaunch).not.toHaveBeenCalled();
    });

    it('closes the page and passes the error on when rendering fails', async () => {
      const error = new Error('Navigation timeout');
      page.pdf.mockRejectedValue(error);

      await expect(service.generate(INPUT, OWNER)).rejects.toBe(error);
      expect(page.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('browser', () => {
    it('starts Chromium once and opens a new page for every PDF', async () => {
      await service.generate(INPUT, OWNER);
      await service.generate(INPUT, OWNER);

      expect(mockLaunch).toHaveBeenCalledTimes(1);
      expect(browser.newPage).toHaveBeenCalledTimes(2);
    });

    it('starts Chromium once for parallel requests', async () => {
      await Promise.all([service.generate(INPUT, OWNER), service.generate(INPUT, OWNER)]);

      expect(mockLaunch).toHaveBeenCalledTimes(1);
    });

    it('starts the headless shell with the sandbox by default', async () => {
      await service.generate(INPUT, OWNER);

      expect(config.get).toHaveBeenCalledWith('PUPPETEER_NO_SANDBOX', { infer: true });
      expect(mockLaunch).toHaveBeenCalledWith({ headless: 'shell', args: [] });
    });

    it('turns the sandbox off when PUPPETEER_NO_SANDBOX is set', async () => {
      config.get.mockReturnValue(true);

      await service.generate(INPUT, OWNER);

      expect(mockLaunch).toHaveBeenCalledWith({ headless: 'shell', args: ['--no-sandbox'] });
    });
  });

  describe('onModuleDestroy', () => {
    it('closes the started browser', async () => {
      await service.generate(INPUT, OWNER);

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
