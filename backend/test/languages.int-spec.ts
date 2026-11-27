import { Proficiency, UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS = 'id name iso nativeName';

const LANGUAGES = `query ($search: String) {
  languages(search: $search) { items { ${FIELDS} } total }
}`;
const CREATE_LANGUAGE = `mutation ($input: CreateLanguageInput!) { createLanguage(input: $input) { ${FIELDS} } }`;
const UPDATE_LANGUAGE = `mutation ($input: UpdateLanguageInput!) { updateLanguage(input: $input) { ${FIELDS} } }`;
const DELETE_LANGUAGE = 'mutation ($id: ID!) { deleteLanguage(id: $id) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

const ENGLISH = { name: 'English', iso: 'EN', nativeName: 'English' };
const GERMAN = { name: 'German', iso: 'DE', nativeName: 'Deutsch' };

describe('Languages (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const language = (data = ENGLISH) => t.prisma.language.create({ data });
  const stored = (id: string) => t.prisma.language.findUnique({ where: { id } });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('languages', () => {
    it('requires authentication', async () => {
      const error = await client().error(LANGUAGES);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('rejects an Employee with FORBIDDEN', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(LANGUAGES);

      expect(error.extensions.code).toBe('FORBIDDEN');
    });

    it('lets an Admin read and search the list', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await language(ENGLISH);
      await language(GERMAN);

      const { languages } = await browser.data<{
        languages: { items: { name: string }[]; total: number };
      }>(LANGUAGES, { search: 'germ' });

      expect(languages).toMatchObject({ total: 1, items: [{ name: 'German' }] });
    });
  });

  describe('createLanguage', () => {
    it('lets an Admin create a language', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const { createLanguage } = await browser.data<{ createLanguage: { id: string } }>(
        CREATE_LANGUAGE,
        { input: GERMAN },
      );

      expect(await stored(createLanguage.id)).toMatchObject(GERMAN);
    });

    it('rejects an Employee with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(CREATE_LANGUAGE, { input: GERMAN });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await t.prisma.language.count()).toBe(0);
    });

    // Names compare case-insensitively (citext); the API upper-cases the ISO code before checking it
    it.each([
      ['name', { ...GERMAN, name: 'ENGLISH' }],
      ['iso', { ...GERMAN, iso: 'en' }],
    ])('rejects a taken %s with CONFLICT on that field', async (field, input) => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await language(ENGLISH);

      const error = await browser.error(CREATE_LANGUAGE, { input });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field });
      expect(await t.prisma.language.count()).toBe(1);
    });
  });

  describe('updateLanguage', () => {
    it('lets an Admin change a language and save it unchanged', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await language(ENGLISH);
      const changed = { ...ENGLISH, nativeName: 'English (UK)' };

      await browser.data(UPDATE_LANGUAGE, { input: { id, ...changed } });
      // wiki: saving an unchanged language must not produce a duplicate error
      await browser.data(UPDATE_LANGUAGE, { input: { id, ...changed } });

      expect(await stored(id)).toMatchObject(changed);
    });

    it('rejects an Employee with FORBIDDEN, unchanged', async () => {
      const { browser } = await signedIn();
      const { id } = await language(ENGLISH);

      const error = await browser.error(UPDATE_LANGUAGE, {
        input: { id, ...ENGLISH, name: 'British English' },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).toMatchObject(ENGLISH);
    });

    it('rejects an ISO code of another language with CONFLICT on iso', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await language(ENGLISH);
      const { id } = await language(GERMAN);

      const error = await browser.error(UPDATE_LANGUAGE, { input: { id, ...GERMAN, iso: 'en' } });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'iso' });
    });

    it('fails with NOT_FOUND for a language that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_LANGUAGE, { input: { id: MISSING_ID, ...GERMAN } });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteLanguage', () => {
    it('lets an Admin delete a language nobody has and returns its id', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await language();

      const { deleteLanguage } = await browser.data<{ deleteLanguage: string }>(DELETE_LANGUAGE, {
        id,
      });

      expect(deleteLanguage).toBe(id);
      expect(await stored(id)).toBeNull();
    });

    it('rejects an Employee with FORBIDDEN and keeps the language', async () => {
      const { browser } = await signedIn();
      const { id } = await language();

      const error = await browser.error(DELETE_LANGUAGE, { id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).not.toBeNull();
    });

    it('rejects a language assigned to a user with ENTITY_IN_USE and keeps it', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await language();
      const user = await createUser(t.prisma);
      await t.prisma.userLanguage.create({
        data: { userId: user.id, languageId: id, proficiency: Proficiency.C1 },
      });

      const error = await browser.error(DELETE_LANGUAGE, { id });

      expect(error.extensions.code).toBe('ENTITY_IN_USE');
      expect(await stored(id)).not.toBeNull();
    });

    it('fails with NOT_FOUND for a language that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(DELETE_LANGUAGE, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
