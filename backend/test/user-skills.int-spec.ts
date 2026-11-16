import { Mastery, UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS = 'id mastery skill { id name }';

const USER_SKILLS = `query ($userId: ID!) { userSkills(userId: $userId) { ${FIELDS} } }`;
const AVAILABLE_SKILLS = `query ($userId: ID!) { availableUserSkills(userId: $userId) { id name } }`;
const CREATE_USER_SKILL = `mutation ($input: CreateUserSkillInput!) { createUserSkill(input: $input) { ${FIELDS} } }`;
const UPDATE_USER_SKILL = `mutation ($input: UpdateUserSkillInput!) { updateUserSkill(input: $input) { ${FIELDS} } }`;
const DELETE_USER_SKILLS =
  'mutation ($userId: ID!, $ids: [ID!]!) { deleteUserSkills(userId: $userId, ids: $ids) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlUserSkill {
  id: string;
  mastery: Mastery;
  skill: { id: string; name: string };
}

describe('User skills (integration)', () => {
  let t: TestApp;
  let react: string;
  let vue: string;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  /** Assigns a skill straight in the database; returns the assignment id. */
  const assign = async (userId: string, skillId: string, mastery: Mastery = Mastery.BEGINNER) =>
    (await t.prisma.userSkill.create({ data: { userId, skillId, mastery }, select: { id: true } }))
      .id;

  /** Assignment ids of the user as stored in the database, sorted. */
  const storedIds = async (userId: string) =>
    (await t.prisma.userSkill.findMany({ where: { userId }, select: { id: true } }))
      .map((row) => row.id)
      .sort();

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    const category = await t.prisma.skillCategory.create({
      data: { name: 'Frontend', type: 'Frontend' },
    });
    ({ id: react } = await t.prisma.skill.create({
      data: { name: 'React', categoryId: category.id },
    }));
    ({ id: vue } = await t.prisma.skill.create({ data: { name: 'Vue', categoryId: category.id } }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('userSkills / availableUserSkills', () => {
    it('requires authentication', async () => {
      const owner = await createUser(t.prisma);

      const error = await client().error(USER_SKILLS, { userId: owner.id });

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it("lets an Employee read another user's skills and the skills still available to them", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      await assign(owner.id, react, Mastery.EXPERT);

      const { userSkills } = await browser.data<{ userSkills: GqlUserSkill[] }>(USER_SKILLS, {
        userId: owner.id,
      });
      const { availableUserSkills } = await browser.data<{
        availableUserSkills: { id: string }[];
      }>(AVAILABLE_SKILLS, { userId: owner.id });

      expect(userSkills).toMatchObject([{ mastery: 'EXPERT', skill: { name: 'React' } }]);
      expect(availableUserSkills.map((skill) => skill.id)).toEqual([vue]);
    });

    it('fails with NOT_FOUND for a user that does not exist', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(USER_SKILLS, { userId: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('createUserSkill', () => {
    it('lets the owner add a skill to their own profile', async () => {
      const { browser, user } = await signedIn();

      const { createUserSkill } = await browser.data<{ createUserSkill: GqlUserSkill }>(
        CREATE_USER_SKILL,
        { input: { userId: user.id, skillId: react, mastery: 'ADVANCED' } },
      );

      expect(createUserSkill).toMatchObject({ mastery: 'ADVANCED', skill: { id: react } });
      expect(await storedIds(user.id)).toEqual([createUserSkill.id]);
    });

    it("lets an Admin add a skill to another user's profile", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);

      await browser.data(CREATE_USER_SKILL, {
        input: { userId: owner.id, skillId: react, mastery: 'BEGINNER' },
      });

      expect(await storedIds(owner.id)).toHaveLength(1);
    });

    it("rejects an Employee adding to another user's profile with FORBIDDEN and creates nothing", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);

      const error = await browser.error(CREATE_USER_SKILL, {
        input: { userId: owner.id, skillId: react, mastery: 'BEGINNER' },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedIds(owner.id)).toEqual([]);
    });

    it('rejects an unverified user with EMAIL_NOT_VERIFIED', async () => {
      const user = await createUser(t.prisma, { verified: false });
      const browser = client();
      await signIn(browser, user.email);

      const error = await browser.error(CREATE_USER_SKILL, {
        input: { userId: user.id, skillId: react, mastery: 'BEGINNER' },
      });

      expect(error.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('rejects a skill the user already has with CONFLICT on skillId, without a duplicate', async () => {
      const { browser, user } = await signedIn();
      const existing = await assign(user.id, react);

      const error = await browser.error(CREATE_USER_SKILL, {
        input: { userId: user.id, skillId: react, mastery: 'EXPERT' },
      });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'skillId' });
      expect(await storedIds(user.id)).toEqual([existing]);
    });

    it('rejects a skill that does not exist with BAD_USER_INPUT on skillId', async () => {
      const { browser, user } = await signedIn();

      const error = await browser.error(CREATE_USER_SKILL, {
        input: { userId: user.id, skillId: MISSING_ID, mastery: 'BEGINNER' },
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'skillId' }],
      });
    });
  });

  describe('updateUserSkill', () => {
    it('lets the owner change the mastery', async () => {
      const { browser, user } = await signedIn();
      const id = await assign(user.id, react);

      const { updateUserSkill } = await browser.data<{ updateUserSkill: GqlUserSkill }>(
        UPDATE_USER_SKILL,
        { input: { id, userId: user.id, mastery: 'EXPERT' } },
      );

      expect(updateUserSkill).toMatchObject({ id, mastery: 'EXPERT' });
    });

    it("rejects an Employee changing another user's skill with FORBIDDEN", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await assign(owner.id, react);

      const error = await browser.error(UPDATE_USER_SKILL, {
        input: { id, userId: owner.id, mastery: 'EXPERT' },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
    });

    it("rejects another user's assignment sent with the own userId with NOT_FOUND, unchanged", async () => {
      const { browser, user } = await signedIn();
      const other = await createUser(t.prisma);
      const foreign = await assign(other.id, react, Mastery.BEGINNER);

      const error = await browser.error(UPDATE_USER_SKILL, {
        input: { id: foreign, userId: user.id, mastery: 'EXPERT' },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
      const row = await t.prisma.userSkill.findUniqueOrThrow({ where: { id: foreign } });
      expect(row.mastery).toBe(Mastery.BEGINNER);
    });
  });

  describe('deleteUserSkills', () => {
    it('lets the owner remove several skills and returns their ids', async () => {
      const { browser, user } = await signedIn();
      const ids = [await assign(user.id, react), await assign(user.id, vue)];

      const { deleteUserSkills } = await browser.data<{ deleteUserSkills: string[] }>(
        DELETE_USER_SKILLS,
        { userId: user.id, ids },
      );

      expect([...deleteUserSkills].sort()).toEqual([...ids].sort());
      expect(await storedIds(user.id)).toEqual([]);
    });

    it("lets an Admin remove another user's skills", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const id = await assign(owner.id, react);

      await browser.data(DELETE_USER_SKILLS, { userId: owner.id, ids: [id] });

      expect(await storedIds(owner.id)).toEqual([]);
    });

    it("rejects an Employee removing from another user's profile with FORBIDDEN, removing nothing", async () => {
      const { browser } = await signedIn();
      const owner = await createUser(t.prisma);
      const id = await assign(owner.id, react);

      const error = await browser.error(DELETE_USER_SKILLS, { userId: owner.id, ids: [id] });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedIds(owner.id)).toEqual([id]);
    });

    it('skips ids that are already removed and removes the rest', async () => {
      const { browser, user } = await signedIn();
      const id = await assign(user.id, react);

      const { deleteUserSkills } = await browser.data<{ deleteUserSkills: string[] }>(
        DELETE_USER_SKILLS,
        { userId: user.id, ids: [id, MISSING_ID] },
      );

      expect(deleteUserSkills).toEqual([id]);
      expect(await storedIds(user.id)).toEqual([]);
    });

    it.each([UserRole.EMPLOYEE, UserRole.ADMIN])(
      "rejects an id of another user's assignment (%s) with FORBIDDEN and removes nothing",
      async (role) => {
        const { browser, user } = await signedIn(role);
        const own = await assign(user.id, react);
        const other = await createUser(t.prisma);
        const foreign = await assign(other.id, react);

        const error = await browser.error(DELETE_USER_SKILLS, {
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
