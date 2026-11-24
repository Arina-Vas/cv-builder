import { UserRole } from '@/common/graphql/enums';
import { createUser, signIn, uniqueEmail } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

// Renders with the real Chromium that puppeteer downloads on install
const GENERATE_CV_PDF = `
  mutation ($input: GenerateCvPdfInput!) {
    generateCvPdf(input: $input) { fileName content }
  }
`;

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlCvPdf {
  fileName: string;
  content: string;
}

/** Document language that Chromium writes from <html lang> into the PDF catalog */
const pdfLang = (content: string): string | undefined =>
  /\/Lang \((\w+)\)/.exec(Buffer.from(content, 'base64').toString('latin1'))?.[1];

/** The first bytes of a PDF file */
const pdfHeader = (content: string): string =>
  Buffer.from(content, 'base64').subarray(0, 5).toString('latin1');

describe('CV PDF (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new user with the given role. */
  const signedIn = async ({
    role = UserRole.EMPLOYEE,
    verified = true,
  }: { role?: UserRole; verified?: boolean } = {}) => {
    const user = await createUser(t.prisma, { role, verified, email: uniqueEmail() });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  /** Creates a CV straight in the database; returns its id. */
  const insertCv = async (userId: string, name = 'Frontend Developer') =>
    (
      await t.prisma.cv.create({
        data: {
          name,
          education: 'BSUIR, Software Engineering',
          description: 'Five years of web development',
          userId,
        },
        select: { id: true },
      })
    ).id;

  const generate = (browser: GqlClient, cvId: string, locale = 'en') =>
    browser.data<{ generateCvPdf: GqlCvPdf }>(GENERATE_CV_PDF, { input: { cvId, locale } });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    // Also closes Chromium (CvPdfService.onModuleDestroy), or Jest would not exit
    await t.app.close();
  });

  it('returns a PDF of the own CV as base64 with a file name from the CV name', async () => {
    const { browser, user } = await signedIn();
    const cvId = await insertCv(user.id, 'Software Engineer with 5 years of experience');

    const { generateCvPdf } = await generate(browser, cvId);

    expect(generateCvPdf.fileName).toBe('software-engineer-with-5-years-of-experience.pdf');
    expect(pdfHeader(generateCvPdf.content)).toBe('%PDF-');
  });

  it('renders the PDF in the requested locale', async () => {
    const { browser, user } = await signedIn();
    const cvId = await insertCv(user.id);

    const { generateCvPdf } = await generate(browser, cvId, 'ru');

    expect(pdfHeader(generateCvPdf.content)).toBe('%PDF-');
    expect(pdfLang(generateCvPdf.content)).toBe('ru');
  });

  it('uses English when the locale is not sent', async () => {
    const { browser, user } = await signedIn();
    const cvId = await insertCv(user.id);

    const { generateCvPdf } = await browser.data<{ generateCvPdf: GqlCvPdf }>(GENERATE_CV_PDF, {
      input: { cvId },
    });

    expect(pdfLang(generateCvPdf.content)).toBe('en');
  });

  it("rejects another user's CV for an Employee with FORBIDDEN and no data", async () => {
    const { browser } = await signedIn();
    const owner = await createUser(t.prisma);
    const cvId = await insertCv(owner.id);

    const body = await browser.send(GENERATE_CV_PDF, { input: { cvId, locale: 'en' } });

    expect(body.errors?.[0]?.extensions.code).toBe('FORBIDDEN');
    expect(body.data).toBeNull();
  });

  it("lets an Admin export another user's CV", async () => {
    const { browser } = await signedIn({ role: UserRole.ADMIN });
    const owner = await createUser(t.prisma);
    const cvId = await insertCv(owner.id);

    const { generateCvPdf } = await generate(browser, cvId);

    expect(generateCvPdf.fileName).toBe('frontend-developer.pdf');
    expect(pdfHeader(generateCvPdf.content)).toBe('%PDF-');
  });

  it('works for a user who has not verified the email yet', async () => {
    const { browser, user } = await signedIn({ verified: false });
    const cvId = await insertCv(user.id);

    const { generateCvPdf } = await generate(browser, cvId);

    expect(pdfHeader(generateCvPdf.content)).toBe('%PDF-');
  });

  it('fails with NOT_FOUND for a CV that does not exist', async () => {
    const { browser } = await signedIn({ role: UserRole.ADMIN });

    const error = await browser.error(GENERATE_CV_PDF, { input: { cvId: MISSING_ID } });

    expect(error.extensions.code).toBe('NOT_FOUND');
  });

  it('fails with BAD_USER_INPUT for an id that is not a UUID', async () => {
    const { browser } = await signedIn();

    const error = await browser.error(GENERATE_CV_PDF, { input: { cvId: 'abc' } });

    expect(error.extensions.code).toBe('BAD_USER_INPUT');
    expect(error.extensions['fields']).toEqual([
      { field: 'cvId', message: expect.any(String) as string },
    ]);
  });

  it('rejects a locale that is not one of the UI languages', async () => {
    const { browser, user } = await signedIn();
    const cvId = await insertCv(user.id);

    const error = await browser.error(GENERATE_CV_PDF, { input: { cvId, locale: 'xx' } });

    expect(error.extensions.code).toBe('BAD_USER_INPUT');
  });

  it('requires authentication', async () => {
    const error = await client().error(GENERATE_CV_PDF, { input: { cvId: MISSING_ID } });

    expect(error.extensions.code).toBe('UNAUTHENTICATED');
  });
});
