import { UserRole } from '@/common/graphql/enums';
import { createUser, signIn, uniqueEmail } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS = 'id name education description user { id email }';
const PAGE = `items { ${FIELDS} } total page pageSize`;

const CVS = `query ($search: String, $sortOrder: SortOrder, $page: Int, $pageSize: Int) {
  cvs(search: $search, sortOrder: $sortOrder, page: $page, pageSize: $pageSize) { ${PAGE} }
}`;
const USER_CVS = `query ($userId: ID!, $search: String) {
  userCvs(userId: $userId, search: $search) { ${PAGE} }
}`;
const CV = `query ($id: ID!) { cv(id: $id) { ${FIELDS} } }`;
const CREATE_CV = `mutation ($input: CreateCvInput!) { createCv(input: $input) { ${FIELDS} } }`;
const UPDATE_CV = `mutation ($input: UpdateCvInput!) { updateCv(input: $input) { ${FIELDS} } }`;
const DELETE_CV = 'mutation ($id: ID!, $userId: ID!) { deleteCv(id: $id, userId: $userId) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlCv {
  id: string;
  name: string;
  education: string;
  description: string;
  user: { id: string; email: string };
}

interface GqlCvPage {
  items: GqlCv[];
  total: number;
  page: number;
  pageSize: number;
}

const FIELDS_INPUT = {
  name: 'Frontend Developer',
  education: 'BSUIR, Software Engineering',
  description: 'Five years of web development',
};

describe('CVs (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE, email = uniqueEmail()) => {
    const user = await createUser(t.prisma, { role, email });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  /** Creates a CV straight in the database; returns its id. */
  const insertCv = async (userId: string, name = 'Frontend Developer') =>
    (
      await t.prisma.cv.create({
        data: { ...FIELDS_INPUT, name, userId },
        select: { id: true },
      })
    ).id;

  /** CV names of the user as stored in the database, sorted. */
  const storedNames = async (userId: string) =>
    (await t.prisma.cv.findMany({ where: { userId }, select: { name: true } }))
      .map((row) => row.name)
      .sort();

  const names = (page: GqlCvPage) => page.items.map((cv) => cv.name);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('cvs', () => {
    it('requires authentication', async () => {
      const error = await client().error(CVS);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('shows an Employee only their own CVs', async () => {
      const { browser, user } = await signedIn();
      const other = await createUser(t.prisma);
      await insertCv(user.id, 'Own CV');
      await insertCv(other.id, 'Foreign CV');

      const { cvs } = await browser.data<{ cvs: GqlCvPage }>(CVS);

      expect(names(cvs)).toEqual(['Own CV']);
      expect(cvs.total).toBe(1);
      expect(cvs.items[0]?.user).toEqual({ id: user.id, email: user.email });
    });

    it("does not find another user's CV for an Employee by name or email", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma, { email: 'other-owner@cv-builder.test' });
      await insertCv(other.id, 'Foreign CV');

      const byName = await browser.data<{ cvs: GqlCvPage }>(CVS, { search: 'Foreign' });
      const byEmail = await browser.data<{ cvs: GqlCvPage }>(CVS, { search: 'other-owner' });

      expect(byName.cvs.total).toBe(0);
      expect(byEmail.cvs.total).toBe(0);
    });

    it('shows an Admin the CVs of all users, sorted by name', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const first = await createUser(t.prisma);
      const second = await createUser(t.prisma);
      await insertCv(first.id, 'Backend Developer');
      await insertCv(second.id, 'Analyst');

      const { cvs } = await browser.data<{ cvs: GqlCvPage }>(CVS);

      expect(names(cvs)).toEqual(['Analyst', 'Backend Developer']);
    });

    it('lets an Admin search by CV name or owner email, case-insensitively', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const anna = await createUser(t.prisma, { email: 'anna@cv-builder.test' });
      const bob = await createUser(t.prisma, { email: 'bob@cv-builder.test' });
      await insertCv(anna.id, 'Designer');
      await insertCv(bob.id, 'Frontend Developer');

      const byName = await browser.data<{ cvs: GqlCvPage }>(CVS, { search: 'FRONTEND' });
      const byEmail = await browser.data<{ cvs: GqlCvPage }>(CVS, { search: 'ANNA@' });

      expect(names(byName.cvs)).toEqual(['Frontend Developer']);
      expect(names(byEmail.cvs)).toEqual(['Designer']);
    });

    it('sorts in descending order and pages the result', async () => {
      const { browser, user } = await signedIn();
      for (const name of ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K']) {
        await insertCv(user.id, name);
      }

      const { cvs } = await browser.data<{ cvs: GqlCvPage }>(CVS, {
        sortOrder: 'DESC',
        page: 2,
        pageSize: 10,
      });

      expect(cvs).toMatchObject({ total: 11, page: 2, pageSize: 10 });
      expect(names(cvs)).toEqual(['A']);
    });
  });

  describe('userCvs', () => {
    it('shows an Admin only the CVs of the selected user, searching by name only', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const selected = await createUser(t.prisma, { email: 'selected@cv-builder.test' });
      const other = await createUser(t.prisma);
      await insertCv(selected.id, 'Frontend Developer');
      await insertCv(selected.id, 'Designer');
      await insertCv(other.id, 'Frontend Lead');

      const all = await browser.data<{ userCvs: GqlCvPage }>(USER_CVS, { userId: selected.id });
      const byName = await browser.data<{ userCvs: GqlCvPage }>(USER_CVS, {
        userId: selected.id,
        search: 'frontend',
      });
      const byEmail = await browser.data<{ userCvs: GqlCvPage }>(USER_CVS, {
        userId: selected.id,
        search: 'selected@',
      });

      expect(names(all.userCvs)).toEqual(['Designer', 'Frontend Developer']);
      expect(names(byName.userCvs)).toEqual(['Frontend Developer']);
      expect(byEmail.userCvs.total).toBe(0);
    });

    it('lets an Employee read their own list', async () => {
      const { browser, user } = await signedIn();
      await insertCv(user.id, 'Own CV');

      const { userCvs } = await browser.data<{ userCvs: GqlCvPage }>(USER_CVS, {
        userId: user.id,
      });

      expect(names(userCvs)).toEqual(['Own CV']);
    });

    it("rejects an Employee reading another user's list with FORBIDDEN", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);
      await insertCv(other.id);

      const error = await browser.error(USER_CVS, { userId: other.id });

      expect(error.extensions.code).toBe('FORBIDDEN');
    });

    it('fails with NOT_FOUND for a user that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(USER_CVS, { userId: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('cv', () => {
    it('returns the own CV with its owner', async () => {
      const { browser, user } = await signedIn();
      const id = await insertCv(user.id);

      const { cv } = await browser.data<{ cv: GqlCv }>(CV, { id });

      expect(cv).toEqual({ id, ...FIELDS_INPUT, user: { id: user.id, email: user.email } });
    });

    it('returns any CV to an Admin', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      const { cv } = await browser.data<{ cv: GqlCv }>(CV, { id });

      expect(cv.user.id).toBe(owner.id);
    });

    it("rejects another user's CV for an Employee with FORBIDDEN and no data", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      const body = await browser.send(CV, { id });

      expect(body.errors?.[0]?.extensions.code).toBe('FORBIDDEN');
      expect(body.data).toBeNull();
    });

    it('fails with NOT_FOUND for a CV that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CV, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('createCv', () => {
    it('lets an Employee create a CV for themselves', async () => {
      const { browser, user } = await signedIn();

      const { createCv } = await browser.data<{ createCv: GqlCv }>(CREATE_CV, {
        input: { userId: user.id, ...FIELDS_INPUT },
      });

      expect(createCv).toMatchObject({ ...FIELDS_INPUT, user: { id: user.id } });
      expect(await storedNames(user.id)).toEqual([FIELDS_INPUT.name]);
    });

    it('lets an Admin create a CV for another user', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);

      const { createCv } = await browser.data<{ createCv: GqlCv }>(CREATE_CV, {
        input: { userId: owner.id, ...FIELDS_INPUT },
      });

      expect(createCv.user.id).toBe(owner.id);
      expect(await storedNames(owner.id)).toEqual([FIELDS_INPUT.name]);
    });

    it('rejects an Employee creating a CV for another user with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);

      const error = await browser.error(CREATE_CV, {
        input: { userId: other.id, ...FIELDS_INPUT },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await t.prisma.cv.count()).toBe(0);
    });

    it('rejects a user that does not exist with NOT_FOUND', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CREATE_CV, {
        input: { userId: MISSING_ID, ...FIELDS_INPUT },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });

    it('rejects invalid fields with BAD_USER_INPUT', async () => {
      const { browser, user } = await signedIn();

      const error = await browser.error(CREATE_CV, {
        input: { userId: user.id, ...FIELDS_INPUT, name: '  ', education: 'a'.repeat(256) },
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: expect.arrayContaining([
          expect.objectContaining({ field: 'name' }),
          expect.objectContaining({ field: 'education' }),
        ]),
      });
      expect(await t.prisma.cv.count()).toBe(0);
    });

    it('rejects an unverified user with EMAIL_NOT_VERIFIED', async () => {
      const user = await createUser(t.prisma, { verified: false });
      const browser = client();
      await signIn(browser, user.email);

      const error = await browser.error(CREATE_CV, {
        input: { userId: user.id, ...FIELDS_INPUT },
      });

      expect(error.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    });
  });

  describe('updateCv', () => {
    const CHANGES = { name: 'Senior Developer', education: 'MIT', description: 'Updated' };

    it('lets the owner update their CV', async () => {
      const { browser, user } = await signedIn();
      const id = await insertCv(user.id);

      const { updateCv } = await browser.data<{ updateCv: GqlCv }>(UPDATE_CV, {
        input: { id, userId: user.id, ...CHANGES },
      });

      expect(updateCv).toMatchObject({ id, ...CHANGES, user: { id: user.id } });
    });

    it("lets an Admin update another user's CV", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      await browser.data(UPDATE_CV, { input: { id, userId: owner.id, ...CHANGES } });

      expect(await storedNames(owner.id)).toEqual([CHANGES.name]);
    });

    it("rejects an Employee updating another user's CV with FORBIDDEN, unchanged", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      const error = await browser.error(UPDATE_CV, { input: { id, userId: owner.id, ...CHANGES } });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedNames(owner.id)).toEqual([FIELDS_INPUT.name]);
    });

    it("rejects another user's CV sent with the own userId with NOT_FOUND, unchanged", async () => {
      const { browser, user } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      const error = await browser.error(UPDATE_CV, { input: { id, userId: user.id, ...CHANGES } });

      expect(error.extensions.code).toBe('NOT_FOUND');
      expect(await storedNames(owner.id)).toEqual([FIELDS_INPUT.name]);
    });

    it('does not let an Admin move a CV to another user through userId', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const other = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      const error = await browser.error(UPDATE_CV, { input: { id, userId: other.id, ...CHANGES } });

      expect(error.extensions.code).toBe('NOT_FOUND');
      const row = await t.prisma.cv.findUniqueOrThrow({ where: { id } });
      expect(row).toMatchObject({ userId: owner.id, name: FIELDS_INPUT.name });
    });
  });

  describe('deleteCv', () => {
    /** Adds a skill and a project to the CV, to check the cascade. */
    const fillCv = async (cvId: string) => {
      const category = await t.prisma.skillCategory.create({
        data: { name: 'Frontend', type: 'Frontend' },
      });
      const skill = await t.prisma.skill.create({
        data: { name: 'React', categoryId: category.id },
      });
      const project = await t.prisma.project.create({
        data: {
          name: 'CV Builder',
          domain: 'HR',
          description: 'Internal tool',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        },
      });
      await t.prisma.cvSkill.create({ data: { cvId, skillId: skill.id } });
      await t.prisma.cvProject.create({
        data: { cvId, projectId: project.id, startDate: new Date('2025-02-01') },
      });
    };

    it('lets the owner delete their CV with its skills and projects and returns its id', async () => {
      const { browser, user } = await signedIn();
      const id = await insertCv(user.id);
      await fillCv(id);

      const { deleteCv } = await browser.data<{ deleteCv: string }>(DELETE_CV, {
        id,
        userId: user.id,
      });

      expect(deleteCv).toBe(id);
      expect(await t.prisma.cv.count()).toBe(0);
      expect(await t.prisma.cvSkill.count()).toBe(0);
      expect(await t.prisma.cvProject.count()).toBe(0);
      // the catalogs stay
      expect(await t.prisma.skill.count()).toBe(1);
      expect(await t.prisma.project.count()).toBe(1);
    });

    it("lets an Admin delete another user's CV", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      await browser.data(DELETE_CV, { id, userId: owner.id });

      expect(await storedNames(owner.id)).toEqual([]);
    });

    it("rejects an Employee deleting another user's CV with FORBIDDEN, keeping it", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await insertCv(owner.id);

      const error = await browser.error(DELETE_CV, { id, userId: owner.id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedNames(owner.id)).toEqual([FIELDS_INPUT.name]);
    });

    it.each([UserRole.EMPLOYEE, UserRole.ADMIN])(
      "rejects another user's CV sent with the own userId (%s) with NOT_FOUND, keeping it",
      async (role) => {
        const { browser, user } = await signedIn(role);
        const owner = await createUser(t.prisma);
        const id = await insertCv(owner.id);

        const error = await browser.error(DELETE_CV, { id, userId: user.id });

        expect(error.extensions.code).toBe('NOT_FOUND');
        expect(await storedNames(owner.id)).toEqual([FIELDS_INPUT.name]);
      },
    );

    it('fails with NOT_FOUND for a CV that is already deleted', async () => {
      const { browser, user } = await signedIn();

      const error = await browser.error(DELETE_CV, { id: MISSING_ID, userId: user.id });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
