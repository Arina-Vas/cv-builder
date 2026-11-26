import { UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS = 'id name domain description startDate endDate technologies { id name }';

const PROJECTS = `query ($search: String) { projects(search: $search) { items { ${FIELDS} } total } }`;
const CREATE_PROJECT = `mutation ($input: CreateProjectInput!) { createProject(input: $input) { ${FIELDS} } }`;
const UPDATE_PROJECT = `mutation ($input: UpdateProjectInput!) { updateProject(input: $input) { ${FIELDS} } }`;
const DELETE_PROJECT = 'mutation ($id: ID!) { deleteProject(id: $id) }';
const PROJECT_ROLES = 'query { projectRoles { id name } }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlProject {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  technologies: { id: string; name: string }[];
}

describe('Projects (integration)', () => {
  let t: TestApp;
  let react: string;
  let nest: string;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  /** Input the API accepts; `Date` scalars are sent as YYYY-MM-DD. */
  const input = (overrides: Record<string, unknown> = {}) => ({
    name: 'CV Builder',
    domain: 'HR',
    description: 'Internal tool for CVs',
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    technologyIds: [react],
    ...overrides,
  });

  const project = (name = 'CV Builder') =>
    t.prisma.project.create({
      data: {
        name,
        domain: 'HR',
        description: 'Internal tool for CVs',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-06-30'),
        technologies: { create: [{ skillId: react }] },
      },
    });
  const stored = (id: string) =>
    t.prisma.project.findUnique({ where: { id }, include: { technologies: true } });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    const category = await t.prisma.skillCategory.create({
      data: { name: 'Frameworks', type: 'Frameworks' },
    });
    ({ id: react } = await t.prisma.skill.create({
      data: { name: 'React', categoryId: category.id },
    }));
    ({ id: nest } = await t.prisma.skill.create({
      data: { name: 'NestJS', categoryId: category.id },
    }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('projects', () => {
    it('requires authentication', async () => {
      const error = await client().error(PROJECTS);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('lets an Employee read and search projects with their technologies', async () => {
      const { browser } = await signedIn();
      await project('CV Builder');
      await project('Payroll');

      const { projects } = await browser.data<{ projects: { items: GqlProject[]; total: number } }>(
        PROJECTS,
        { search: 'pay' },
      );

      expect(projects).toMatchObject({
        total: 1,
        items: [{ name: 'Payroll', startDate: '2026-01-01', technologies: [{ name: 'React' }] }],
      });
    });
  });

  describe('projectRoles', () => {
    it('requires authentication', async () => {
      const error = await client().error(PROJECT_ROLES);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('lets an Employee read all roles sorted by name', async () => {
      const { browser } = await signedIn();
      await t.prisma.projectRole.createMany({
        data: [{ name: 'Team Lead' }, { name: 'Developer' }, { name: 'QA Engineer' }],
      });

      const { projectRoles } = await browser.data<{ projectRoles: { id: string; name: string }[] }>(
        PROJECT_ROLES,
      );

      expect(projectRoles.map((role) => role.name)).toEqual([
        'Developer',
        'QA Engineer',
        'Team Lead',
      ]);
    });
  });

  describe('createProject', () => {
    it('lets an Admin create a project with technologies', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const { createProject } = await browser.data<{ createProject: GqlProject }>(CREATE_PROJECT, {
        input: input({ technologyIds: [react, nest] }),
      });

      expect(createProject).toMatchObject({ startDate: '2026-01-01', endDate: '2026-06-30' });
      const row = await stored(createProject.id);
      expect(row?.technologies.map((tech) => tech.skillId).sort()).toEqual([react, nest].sort());
    });

    it('rejects an Employee with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(CREATE_PROJECT, { input: input() });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await t.prisma.project.count()).toBe(0);
    });

    it('rejects a technology that does not exist with BAD_USER_INPUT on technologyIds', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CREATE_PROJECT, {
        input: input({ technologyIds: [react, MISSING_ID] }),
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'technologyIds' }],
      });
      expect(await t.prisma.project.count()).toBe(0);
    });

    it('rejects an end date before the start date with BAD_USER_INPUT on endDate', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CREATE_PROJECT, {
        input: input({ startDate: '2026-06-30', endDate: '2026-01-01' }),
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'endDate', message: 'End date must be later than start date' }],
      });
    });
  });

  describe('updateProject', () => {
    it('lets an Admin change a project and replace its technologies', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await project();

      await browser.data(UPDATE_PROJECT, {
        input: { id, ...input({ name: 'CV Builder 2', technologyIds: [nest] }) },
      });

      const row = await stored(id);
      expect(row?.name).toBe('CV Builder 2');
      expect(row?.technologies.map((tech) => tech.skillId)).toEqual([nest]);
    });

    it('rejects an Employee with FORBIDDEN, unchanged', async () => {
      const { browser } = await signedIn();
      const { id } = await project('CV Builder');

      const error = await browser.error(UPDATE_PROJECT, {
        input: { id, ...input({ name: 'Renamed' }) },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect((await stored(id))?.name).toBe('CV Builder');
    });

    it('fails with NOT_FOUND for a project that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_PROJECT, { input: { id: MISSING_ID, ...input() } });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteProject', () => {
    it('lets an Admin delete a project no CV uses, with its technology links', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await project();

      const { deleteProject } = await browser.data<{ deleteProject: string }>(DELETE_PROJECT, {
        id,
      });

      expect(deleteProject).toBe(id);
      expect(await stored(id)).toBeNull();
      // project_skills go with the project (Cascade), the skill itself stays
      expect(await t.prisma.projectSkill.count()).toBe(0);
      expect(await t.prisma.skill.count({ where: { id: react } })).toBe(1);
    });

    it('rejects an Employee with FORBIDDEN and keeps the project', async () => {
      const { browser } = await signedIn();
      const { id } = await project();

      const error = await browser.error(DELETE_PROJECT, { id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).not.toBeNull();
    });

    it('rejects a project used in a CV with ENTITY_IN_USE and keeps it', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await project();
      const owner = await createUser(t.prisma);
      await t.prisma.cv.create({
        data: {
          name: 'Frontend CV',
          education: 'BSU',
          description: 'React developer',
          userId: owner.id,
          projects: { create: [{ projectId: id, startDate: new Date('2026-01-01') }] },
        },
      });

      const error = await browser.error(DELETE_PROJECT, { id });

      expect(error.extensions.code).toBe('ENTITY_IN_USE');
      expect(await stored(id)).not.toBeNull();
    });

    it('fails with NOT_FOUND for a project that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(DELETE_PROJECT, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
