import { Mastery, UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS = 'id mastery skill { id name category { name } }';

const CV_SKILLS = `query ($cvId: ID!) { cvSkills(cvId: $cvId) { ${FIELDS} } }`;
const AVAILABLE = 'query ($cvId: ID!) { availableCvSkills(cvId: $cvId) { id name } }';
const CREATE = `mutation ($input: CreateCvSkillInput!) { createCvSkill(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateCvSkillInput!) { updateCvSkill(input: $input) { ${FIELDS} } }`;
const UPDATE_USER_SKILL =
  'mutation ($input: UpdateUserSkillInput!) { updateUserSkill(input: $input) { id mastery } }';
const DELETE = 'mutation ($cvId: ID!, $ids: [ID!]!) { deleteCvSkills(cvId: $cvId, ids: $ids) }';
const DELETE_USER_SKILLS =
  'mutation ($userId: ID!, $ids: [ID!]!) { deleteUserSkills(userId: $userId, ids: $ids) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlCvSkill {
  id: string;
  mastery: Mastery;
  skill: { id: string; name: string; category: { name: string } };
}

describe('CV skills (integration)', () => {
  let t: TestApp;
  let react: string;
  let vue: string;
  let postgres: string;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const insertCv = async (userId: string) =>
    (
      await t.prisma.cv.create({
        data: { name: 'Frontend CV', education: 'BSUIR', description: 'React developer', userId },
        select: { id: true },
      })
    ).id;

  /** Gives the user a skill straight in the database; returns the UserSkill id. */
  const assign = async (userId: string, skillId: string, mastery: Mastery = Mastery.ADVANCED) =>
    (await t.prisma.userSkill.create({ data: { userId, skillId, mastery }, select: { id: true } }))
      .id;

  /** Adds a skill to a CV straight in the database; returns the CvSkill id. */
  const insertCvSkill = async (
    cvId: string,
    skillId: string,
    mastery: Mastery = Mastery.ADVANCED,
  ) =>
    (await t.prisma.cvSkill.create({ data: { cvId, skillId, mastery }, select: { id: true } })).id;

  const storedMastery = async (cvSkillId: string) =>
    (await t.prisma.cvSkill.findUniqueOrThrow({ where: { id: cvSkillId } })).mastery;

  const list = (browser: GqlClient, cvId: string) =>
    browser.data<{ cvSkills: GqlCvSkill[] }>(CV_SKILLS, { cvId }).then((data) => data.cvSkills);

  /** Skill ids stored for the CV, sorted. */
  const storedSkillIds = async (cvId: string) =>
    (await t.prisma.cvSkill.findMany({ where: { cvId }, select: { skillId: true } }))
      .map((row) => row.skillId)
      .sort();

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    const frontend = await t.prisma.skillCategory.create({
      data: { name: 'Frontend', type: 'Frontend' },
    });
    const databases = await t.prisma.skillCategory.create({
      data: { name: 'Databases', type: 'Databases' },
    });
    ({ id: react } = await t.prisma.skill.create({
      data: { name: 'React', categoryId: frontend.id },
    }));
    ({ id: vue } = await t.prisma.skill.create({ data: { name: 'Vue', categoryId: frontend.id } }));
    ({ id: postgres } = await t.prisma.skill.create({
      data: { name: 'PostgreSQL', categoryId: databases.id },
    }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('access', () => {
    it('requires authentication', async () => {
      const error = await client().error(CV_SKILLS, { cvId: MISSING_ID });

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it("rejects an Employee on another user's CV with FORBIDDEN and changes nothing", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);
      const cvId = await insertCv(other.id);
      await assign(other.id, react);
      await assign(other.id, vue);
      const cvSkillId = await insertCvSkill(cvId, react);

      const errors = await Promise.all([
        browser.error(CV_SKILLS, { cvId }),
        browser.error(AVAILABLE, { cvId }),
        browser.error(CREATE, { input: { cvId, skillId: vue } }),
        browser.error(UPDATE, { input: { id: cvSkillId, mastery: Mastery.EXPERT } }),
        browser.error(DELETE, { cvId, ids: [cvSkillId] }),
      ]);

      expect(errors.map((error) => error.extensions.code)).toEqual(Array(5).fill('FORBIDDEN'));
      expect(await storedSkillIds(cvId)).toEqual([react]);
      expect(await storedMastery(cvSkillId)).toBe(Mastery.ADVANCED);
    });

    it("lets an Admin manage another user's CV skills with the owner's mastery", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const cvId = await insertCv(owner.id);
      await assign(owner.id, react, Mastery.EXPERT);

      const { createCvSkill } = await browser.data<{ createCvSkill: GqlCvSkill }>(CREATE, {
        input: { cvId, skillId: react },
      });

      expect(createCvSkill).toMatchObject({ mastery: Mastery.EXPERT, skill: { id: react } });
      expect(await storedSkillIds(cvId)).toEqual([react]);
    });

    it('fails with NOT_FOUND for a CV that does not exist', async () => {
      const { browser } = await signedIn();

      const errors = await Promise.all([
        browser.error(CV_SKILLS, { cvId: MISSING_ID }),
        browser.error(AVAILABLE, { cvId: MISSING_ID }),
        browser.error(CREATE, { input: { cvId: MISSING_ID, skillId: react } }),
        browser.error(UPDATE, { input: { id: MISSING_ID, mastery: Mastery.EXPERT } }),
        browser.error(DELETE, { cvId: MISSING_ID, ids: [MISSING_ID] }),
      ]);

      expect(errors.map((error) => error.extensions.code)).toEqual(Array(5).fill('NOT_FOUND'));
    });
  });

  describe('cvSkills', () => {
    it("lists only this CV's skills with their CV mastery, grouped by category", async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const otherCvId = await insertCv(user.id);
      await assign(user.id, react);
      await assign(user.id, vue);
      await assign(user.id, postgres);
      await insertCvSkill(cvId, react, Mastery.EXPERT);
      await insertCvSkill(cvId, postgres, Mastery.BEGINNER);
      await insertCvSkill(otherCvId, vue);

      const result = await list(browser, cvId);

      expect(result).toMatchObject([
        {
          mastery: Mastery.BEGINNER,
          skill: { name: 'PostgreSQL', category: { name: 'Databases' } },
        },
        { mastery: Mastery.EXPERT, skill: { name: 'React', category: { name: 'Frontend' } } },
      ]);
    });

    it('leaves out a CV skill the owner no longer has instead of failing the list', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await assign(user.id, react);
      await insertCvSkill(cvId, react);
      // No UserSkill behind it: the state a create racing with a removal from the profile leaves
      await insertCvSkill(cvId, vue);

      const result = await list(browser, cvId);

      expect(result.map((item) => item.skill.name)).toEqual(['React']);
    });

    it('returns an empty list for a CV without skills', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      await expect(list(browser, cvId)).resolves.toEqual([]);
    });
  });

  describe('availableCvSkills', () => {
    it("offers only the owner's skills that are not in the CV yet", async () => {
      const { browser, user } = await signedIn();
      const other = await createUser(t.prisma);
      const cvId = await insertCv(user.id);
      await assign(user.id, react);
      await assign(user.id, vue);
      await assign(other.id, postgres);
      await insertCvSkill(cvId, react);

      const { availableCvSkills } = await browser.data<{
        availableCvSkills: { id: string; name: string }[];
      }>(AVAILABLE, { cvId });

      expect(availableCvSkills).toEqual([{ id: vue, name: 'Vue' }]);
    });
  });

  describe('createCvSkill', () => {
    it("adds one of the owner's skills to the CV", async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await assign(user.id, react, Mastery.ADVANCED);

      const { createCvSkill } = await browser.data<{ createCvSkill: GqlCvSkill }>(CREATE, {
        input: { cvId, skillId: react },
      });

      expect(createCvSkill).toMatchObject({
        mastery: Mastery.ADVANCED,
        skill: { id: react, name: 'React', category: { name: 'Frontend' } },
      });
      expect(await storedSkillIds(cvId)).toEqual([react]);
    });

    it('rejects a skill the owner does not have with BAD_USER_INPUT and stores nothing', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const error = await browser.error(CREATE, { input: { cvId, skillId: react } });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'skillId', message: 'Skill is not assigned to the CV owner' }],
      });
      expect(await storedSkillIds(cvId)).toEqual([]);
    });

    it('rejects a skill already in the CV with CONFLICT', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await assign(user.id, react);
      await insertCvSkill(cvId, react);

      const error = await browser.error(CREATE, { input: { cvId, skillId: react } });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'skillId' });
      expect(await storedSkillIds(cvId)).toEqual([react]);
    });

    it('rejects ids that are not UUIDs with BAD_USER_INPUT', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const error = await browser.error(CREATE, { input: { cvId, skillId: 'react' } });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
    });
  });

  describe('updateCvSkill', () => {
    it('changes the mastery in this CV only and keeps the profile and other CVs', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const otherCvId = await insertCv(user.id);
      await assign(user.id, react, Mastery.INTERMEDIATE);
      const id = await insertCvSkill(cvId, react, Mastery.INTERMEDIATE);
      const otherId = await insertCvSkill(otherCvId, react, Mastery.INTERMEDIATE);

      const { updateCvSkill } = await browser.data<{ updateCvSkill: GqlCvSkill }>(UPDATE, {
        input: { id, mastery: Mastery.EXPERT },
      });

      expect(updateCvSkill).toMatchObject({ id, mastery: Mastery.EXPERT, skill: { id: react } });
      expect(await storedMastery(id)).toBe(Mastery.EXPERT);
      expect(await storedMastery(otherId)).toBe(Mastery.INTERMEDIATE);
      const profile = await t.prisma.userSkill.findFirstOrThrow({ where: { userId: user.id } });
      expect(profile.mastery).toBe(Mastery.INTERMEDIATE);
    });

    it("lets an Admin change the mastery in another user's CV", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const cvId = await insertCv(owner.id);
      await assign(owner.id, react);
      const id = await insertCvSkill(cvId, react);

      await browser.data(UPDATE, { input: { id, mastery: Mastery.BEGINNER } });

      expect(await storedMastery(id)).toBe(Mastery.BEGINNER);
    });

    it('rejects an unknown mastery with BAD_USER_INPUT', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await assign(user.id, react);
      const id = await insertCvSkill(cvId, react);

      const error = await browser.error(UPDATE, { input: { id, mastery: 'GURU' } });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
      expect(await storedMastery(id)).toBe(Mastery.ADVANCED);
    });
  });

  describe('changing the mastery in the profile', () => {
    it('keeps the mastery already stored in the CV', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const userReact = await assign(user.id, react, Mastery.INTERMEDIATE);
      await browser.data(CREATE, { input: { cvId, skillId: react } });

      await browser.data(UPDATE_USER_SKILL, {
        input: { id: userReact, userId: user.id, mastery: Mastery.EXPERT },
      });

      const result = await list(browser, cvId);
      expect(result.map((item) => item.mastery)).toEqual([Mastery.INTERMEDIATE]);
    });
  });

  describe('deleteCvSkills', () => {
    it('removes the selected skills from the CV and keeps the catalog and profile skills', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await assign(user.id, react);
      await assign(user.id, vue);
      const ids = [await insertCvSkill(cvId, react), await insertCvSkill(cvId, vue)];

      const { deleteCvSkills } = await browser.data<{ deleteCvSkills: string[] }>(DELETE, {
        cvId,
        ids,
      });

      expect([...deleteCvSkills].sort()).toEqual([...ids].sort());
      expect(await storedSkillIds(cvId)).toEqual([]);
      expect(await t.prisma.userSkill.count({ where: { userId: user.id } })).toBe(2);
      expect(await t.prisma.skill.count()).toBe(3);
    });

    it('skips ids that are already removed', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await assign(user.id, react);
      const id = await insertCvSkill(cvId, react);

      const { deleteCvSkills } = await browser.data<{ deleteCvSkills: string[] }>(DELETE, {
        cvId,
        ids: [id, MISSING_ID],
      });

      expect(deleteCvSkills).toEqual([id]);
    });

    it('rejects an id of another CV with FORBIDDEN and removes nothing', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const otherCvId = await insertCv(user.id);
      await assign(user.id, react);
      await assign(user.id, vue);
      const own = await insertCvSkill(cvId, react);
      const foreign = await insertCvSkill(otherCvId, vue);

      const error = await browser.error(DELETE, { cvId, ids: [own, foreign] });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await storedSkillIds(cvId)).toEqual([react]);
      expect(await storedSkillIds(otherCvId)).toEqual([vue]);
    });
  });

  describe('removing a skill from the profile', () => {
    /** Skill ids in the user's profile, sorted. */
    const profileSkillIds = async (userId: string) =>
      (await t.prisma.userSkill.findMany({ where: { userId }, select: { skillId: true } }))
        .map((row) => row.skillId)
        .sort();

    it("rejects skills used in the owner's CVs with ENTITY_IN_USE and the ids of those assignments", async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const userReact = await assign(user.id, react);
      const userVue = await assign(user.id, vue);
      await insertCvSkill(cvId, react);

      const error = await browser.error(DELETE_USER_SKILLS, {
        userId: user.id,
        ids: [userReact, userVue],
      });

      expect(error.extensions).toMatchObject({ code: 'ENTITY_IN_USE', ids: [userReact] });
      // The request is rejected as a whole: the free skill (Vue) stays too, the CV is unchanged
      expect(await profileSkillIds(user.id)).toEqual([react, vue].sort());
      expect(await storedSkillIds(cvId)).toEqual([react]);
    });

    it("removes a skill that only another user's CV lists", async () => {
      const { browser, user } = await signedIn();
      const other = await createUser(t.prisma);
      const otherCvId = await insertCv(other.id);
      const userReact = await assign(user.id, react);
      await assign(other.id, react);
      await insertCvSkill(otherCvId, react);

      await browser.data(DELETE_USER_SKILLS, { userId: user.id, ids: [userReact] });

      expect(await profileSkillIds(user.id)).toEqual([]);
      expect(await storedSkillIds(otherCvId)).toEqual([react]);
    });
  });
});
