import { Mastery, UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const SKILLS = `query ($search: String) {
  skills(search: $search) { items { id name category { name } } total }
}`;
const SKILL_CATEGORIES = 'query { skillCategories { id name type } }';
const CREATE_SKILL = `mutation ($input: CreateSkillInput!) { createSkill(input: $input) { id name category { id } } }`;
const UPDATE_SKILL = `mutation ($input: UpdateSkillInput!) { updateSkill(input: $input) { id name category { id } } }`;
const DELETE_SKILL = 'mutation ($id: ID!) { deleteSkill(id: $id) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Skills (integration)', () => {
  let t: TestApp;
  let frontend: string;
  let backend: string;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const skill = (name = 'React', categoryId = frontend) =>
    t.prisma.skill.create({ data: { name, categoryId } });
  const stored = (id: string) => t.prisma.skill.findUnique({ where: { id } });

  /** Ways a skill gets referenced; each one blocks deleting it. */
  const references: [string, (skillId: string) => Promise<unknown>][] = [
    [
      'a user',
      async (skillId) =>
        t.prisma.userSkill.create({
          data: { skillId, userId: (await createUser(t.prisma)).id, mastery: Mastery.EXPERT },
        }),
    ],
    [
      'a project',
      (skillId) =>
        t.prisma.project.create({
          data: {
            name: 'CV Builder',
            domain: 'HR',
            description: 'Internal tool',
            startDate: new Date('2026-01-01'),
            endDate: new Date('2026-06-01'),
            technologies: { create: [{ skillId }] },
          },
        }),
    ],
    [
      'a CV',
      async (skillId) =>
        t.prisma.cv.create({
          data: {
            name: 'Frontend CV',
            education: 'BSU',
            description: 'React developer',
            userId: (await createUser(t.prisma)).id,
            skills: { create: [{ skillId, mastery: Mastery.ADVANCED }] },
          },
        }),
    ],
  ];

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    ({ id: frontend } = await t.prisma.skillCategory.create({
      data: { name: 'Frontend', type: 'Frontend' },
    }));
    ({ id: backend } = await t.prisma.skillCategory.create({
      data: { name: 'Backend', type: 'Backend' },
    }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('skills / skillCategories', () => {
    it('requires authentication', async () => {
      const error = await client().error(SKILLS);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('lets an Employee read and search skills with their category, and read the categories', async () => {
      const { browser } = await signedIn();
      await skill('React');
      await skill('NestJS', backend);

      const { skills } = await browser.data<{
        skills: { items: { name: string; category: { name: string } }[]; total: number };
      }>(SKILLS, { search: 'nest' });
      const { skillCategories } = await browser.data<{ skillCategories: { name: string }[] }>(
        SKILL_CATEGORIES,
      );

      expect(skills).toMatchObject({
        total: 1,
        items: [{ name: 'NestJS', category: { name: 'Backend' } }],
      });
      expect(skillCategories).toHaveLength(2);
    });
  });

  describe('createSkill', () => {
    it('lets an Admin create a skill in a category', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const { createSkill } = await browser.data<{ createSkill: { id: string } }>(CREATE_SKILL, {
        input: { name: 'Vue', categoryId: frontend },
      });

      expect(await stored(createSkill.id)).toMatchObject({ name: 'Vue', categoryId: frontend });
    });

    it('rejects an Employee with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(CREATE_SKILL, {
        input: { name: 'Vue', categoryId: frontend },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await t.prisma.skill.count()).toBe(0);
    });

    it('rejects a name that differs only in case with CONFLICT on name', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await skill('React');

      const error = await browser.error(CREATE_SKILL, {
        input: { name: 'react', categoryId: backend },
      });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'name' });
    });

    it('rejects a category that does not exist with BAD_USER_INPUT on categoryId', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CREATE_SKILL, {
        input: { name: 'Vue', categoryId: MISSING_ID },
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'categoryId' }],
      });
    });
  });

  describe('updateSkill', () => {
    it('lets an Admin rename a skill and move it to another category', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await skill('Node');

      await browser.data(UPDATE_SKILL, { input: { id, name: 'Node.js', categoryId: backend } });

      expect(await stored(id)).toMatchObject({ name: 'Node.js', categoryId: backend });
    });

    it('rejects an Employee with FORBIDDEN, unchanged', async () => {
      const { browser } = await signedIn();
      const { id } = await skill('React');

      const error = await browser.error(UPDATE_SKILL, {
        input: { id, name: 'React.js', categoryId: frontend },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).toMatchObject({ name: 'React' });
    });

    it('fails with NOT_FOUND for a skill that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_SKILL, {
        input: { id: MISSING_ID, name: 'Vue', categoryId: frontend },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteSkill', () => {
    it('lets an Admin delete a skill nothing references and returns its id', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await skill();

      const { deleteSkill } = await browser.data<{ deleteSkill: string }>(DELETE_SKILL, { id });

      expect(deleteSkill).toBe(id);
      expect(await stored(id)).toBeNull();
    });

    it('rejects an Employee with FORBIDDEN and keeps the skill', async () => {
      const { browser } = await signedIn();
      const { id } = await skill();

      const error = await browser.error(DELETE_SKILL, { id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).not.toBeNull();
    });

    it.each(references)(
      'rejects a skill used by %s with ENTITY_IN_USE and keeps it',
      async (_by, reference) => {
        const { browser } = await signedIn(UserRole.ADMIN);
        const { id } = await skill();
        await reference(id);

        const error = await browser.error(DELETE_SKILL, { id });

        expect(error.extensions.code).toBe('ENTITY_IN_USE');
        expect(await stored(id)).not.toBeNull();
      },
    );

    it('fails with NOT_FOUND for a skill that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(DELETE_SKILL, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
