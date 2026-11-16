import { Proficiency, UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS = 'id proficiency language { id name }';

const USER_LANGUAGES = `query ($userId: ID!) { userLanguages(userId: $userId) { ${FIELDS} } }`;
const AVAILABLE_LANGUAGES = `query ($userId: ID!) { availableUserLanguages(userId: $userId) { id name } }`;
const CREATE_USER_LANGUAGE = `mutation ($input: CreateUserLanguageInput!) { createUserLanguage(input: $input) { ${FIELDS} } }`;
const UPDATE_USER_LANGUAGE = `mutation ($input: UpdateUserLanguageInput!) { updateUserLanguage(input: $input) { ${FIELDS} } }`;
const DELETE_USER_LANGUAGES =
  'mutation ($userId: ID!, $ids: [ID!]!) { deleteUserLanguages(userId: $userId, ids: $ids) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlUserLanguage {
  id: string;
  proficiency: Proficiency;
  language: { id: string; name: string };
}

describe('User languages (integration)', () => {
  let t: TestApp;
  let english: string;
  let german: string;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  /** Assigns a language straight in the database; returns the assignment id. */
  const assign = async (
    userId: string,
    languageId: string,
    proficiency: Proficiency = Proficiency.B1,
  ) =>
    (
      await t.prisma.userLanguage.create({
        data: { userId, languageId, proficiency },
        select: { id: true },
      })
    ).id;

  /** Assignment ids of the user as stored in the database, sorted. */
  const storedIds = async (userId: string) =>
    (await t.prisma.userLanguage.findMany({ where: { userId }, select: { id: true } }))
      .map((row) => row.id)
      .sort();

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    ({ id: english } = await t.prisma.language.create({
      data: { name: 'English', iso: 'en', nativeName: 'English' },
    }));
    ({ id: german } = await t.prisma.language.create({
      data: { name: 'German', iso: 'de', nativeName: 'Deutsch' },
    }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('userLanguages / availableUserLanguages', () => {
    it('requires authentication', async () => {
      const owner = await createUser(t.prisma);

      const error = await client().error(USER_LANGUAGES, { userId: owner.id });

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it("lets an Employee read another user's languages and the languages still available to them", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      await assign(owner.id, english, Proficiency.C1);

      const { userLanguages } = await browser.data<{ userLanguages: GqlUserLanguage[] }>(
        USER_LANGUAGES,
        { userId: owner.id },
      );
      const { availableUserLanguages } = await browser.data<{
        availableUserLanguages: { id: string }[];
      }>(AVAILABLE_LANGUAGES, { userId: owner.id });

      expect(userLanguages).toMatchObject([{ proficiency: 'C1', language: { name: 'English' } }]);
      expect(availableUserLanguages.map((language) => language.id)).toEqual([german]);
    });

    it('fails with NOT_FOUND for a user that does not exist', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(USER_LANGUAGES, { userId: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('createUserLanguage', () => {
    it('lets the owner add a language to their own profile', async () => {
      const { browser, user } = await signedIn();

      const { createUserLanguage } = await browser.data<{ createUserLanguage: GqlUserLanguage }>(
        CREATE_USER_LANGUAGE,
        { input: { userId: user.id, languageId: english, proficiency: 'B2' } },
      );

      expect(createUserLanguage).toMatchObject({ proficiency: 'B2', language: { id: english } });
      expect(await storedIds(user.id)).toEqual([createUserLanguage.id]);
    });

    it("lets an Admin add a language to another user's profile", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);

      await browser.data(CREATE_USER_LANGUAGE, {
        input: { userId: owner.id, languageId: english, proficiency: 'A2' },
      });

      expect(await storedIds(owner.id)).toHaveLength(1);
    });

    it("rejects an Employee adding to another user's profile with FORBIDDEN and creates nothing", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);

      const error = await browser.error(CREATE_USER_LANGUAGE, {
        input: { userId: owner.id, languageId: english, proficiency: 'A2' },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedIds(owner.id)).toEqual([]);
    });

    it('rejects an unverified user with EMAIL_NOT_VERIFIED', async () => {
      const user = await createUser(t.prisma, { verified: false });
      const browser = client();
      await signIn(browser, user.email);

      const error = await browser.error(CREATE_USER_LANGUAGE, {
        input: { userId: user.id, languageId: english, proficiency: 'A2' },
      });

      expect(error.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('rejects a language the user already has with CONFLICT on languageId, without a duplicate', async () => {
      const { browser, user } = await signedIn();
      const existing = await assign(user.id, english);

      const error = await browser.error(CREATE_USER_LANGUAGE, {
        input: { userId: user.id, languageId: english, proficiency: 'C2' },
      });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'languageId' });
      expect(await storedIds(user.id)).toEqual([existing]);
    });

    it('rejects a language that does not exist with BAD_USER_INPUT on languageId', async () => {
      const { browser, user } = await signedIn();

      const error = await browser.error(CREATE_USER_LANGUAGE, {
        input: { userId: user.id, languageId: MISSING_ID, proficiency: 'A2' },
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'languageId' }],
      });
    });
  });

  describe('updateUserLanguage', () => {
    it('lets the owner change the proficiency', async () => {
      const { browser, user } = await signedIn();
      const id = await assign(user.id, english);

      const { updateUserLanguage } = await browser.data<{ updateUserLanguage: GqlUserLanguage }>(
        UPDATE_USER_LANGUAGE,
        { input: { id, userId: user.id, proficiency: 'NATIVE' } },
      );

      expect(updateUserLanguage).toMatchObject({ id, proficiency: 'NATIVE' });
    });

    it("rejects an Employee changing another user's language with FORBIDDEN", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await assign(owner.id, english);

      const error = await browser.error(UPDATE_USER_LANGUAGE, {
        input: { id, userId: owner.id, proficiency: 'NATIVE' },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
    });

    it("rejects another user's assignment sent with the own userId with NOT_FOUND, unchanged", async () => {
      const { browser, user } = await signedIn();
      const other = await createUser(t.prisma);
      const foreign = await assign(other.id, english, Proficiency.B1);

      const error = await browser.error(UPDATE_USER_LANGUAGE, {
        input: { id: foreign, userId: user.id, proficiency: 'NATIVE' },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
      const row = await t.prisma.userLanguage.findUniqueOrThrow({ where: { id: foreign } });
      expect(row.proficiency).toBe(Proficiency.B1);
    });
  });

  describe('deleteUserLanguages', () => {
    it('lets the owner remove several languages and returns their ids', async () => {
      const { browser, user } = await signedIn();
      const ids = [await assign(user.id, english), await assign(user.id, german)];

      const { deleteUserLanguages } = await browser.data<{ deleteUserLanguages: string[] }>(
        DELETE_USER_LANGUAGES,
        { userId: user.id, ids },
      );

      expect([...deleteUserLanguages].sort()).toEqual([...ids].sort());
      expect(await storedIds(user.id)).toEqual([]);
    });

    it("lets an Admin remove another user's languages", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const id = await assign(owner.id, english);

      await browser.data(DELETE_USER_LANGUAGES, { userId: owner.id, ids: [id] });

      expect(await storedIds(owner.id)).toEqual([]);
    });

    it("rejects an Employee removing from another user's profile with FORBIDDEN, removing nothing", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await assign(owner.id, english);

      const error = await browser.error(DELETE_USER_LANGUAGES, { userId: owner.id, ids: [id] });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedIds(owner.id)).toEqual([id]);
    });

    it('skips ids that are already removed and removes the rest', async () => {
      const { browser, user } = await signedIn();
      const id = await assign(user.id, english);

      const { deleteUserLanguages } = await browser.data<{ deleteUserLanguages: string[] }>(
        DELETE_USER_LANGUAGES,
        { userId: user.id, ids: [id, MISSING_ID] },
      );

      expect(deleteUserLanguages).toEqual([id]);
      expect(await storedIds(user.id)).toEqual([]);
    });

    it.each([UserRole.EMPLOYEE, UserRole.ADMIN])(
      "rejects an id of another user's assignment (%s) with FORBIDDEN and removes nothing",
      async (role) => {
        const { browser, user } = await signedIn(role);
        const own = await assign(user.id, english);
        const other = await createUser(t.prisma);
        const foreign = await assign(other.id, english);

        const error = await browser.error(DELETE_USER_LANGUAGES, {
          userId: user.id,
          ids: [own, foreign],
        });

        expect(error.extensions.code).toBe('FORBIDDEN');
        // the own assignment from the same request stays too: the request is rejected as a whole
        expect(await storedIds(user.id)).toEqual([own]);
        expect(await storedIds(other.id)).toEqual([foreign]);
      },
    );
  });
});
