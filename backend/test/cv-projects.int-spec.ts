import { UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS =
  'id startDate endDate responsibilities roles { id name } ' +
  'project { id name domain startDate endDate technologies { name } }';

const CV_PROJECTS = `query ($cvId: ID!, $search: String, $sortBy: CvProjectSortField, $sortOrder: SortOrder) {
  cvProjects(cvId: $cvId, search: $search, sortBy: $sortBy, sortOrder: $sortOrder) { items { ${FIELDS} } total }
}`;
const AVAILABLE = 'query ($cvId: ID!) { availableCvProjects(cvId: $cvId) { id name } }';
const CREATE = `mutation ($input: CreateCvProjectInput!) { createCvProject(input: $input) { ${FIELDS} } }`;
const UPDATE = `mutation ($input: UpdateCvProjectInput!) { updateCvProject(input: $input) { ${FIELDS} } }`;
const DELETE = 'mutation ($id: ID!, $cvId: ID!) { deleteCvProject(id: $id, cvId: $cvId) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlCvProject {
  id: string;
  startDate: string;
  endDate: string | null;
  responsibilities: string | null;
  roles: { id: string; name: string }[];
  project: { id: string; name: string; domain: string; technologies: { name: string }[] };
}

interface GqlCvProjectList {
  items: GqlCvProject[];
  total: number;
}

describe('CV projects (integration)', () => {
  let t: TestApp;
  let developer: string;
  let teamLead: string;
  let react: string;
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

  /** A catalog project running through 2026. */
  const insertProject = async (name = 'CV Builder', domain = 'HR') =>
    (
      await t.prisma.project.create({
        data: {
          name,
          domain,
          description: `${name} description`,
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          technologies: { create: [{ skillId: react }] },
        },
        select: { id: true },
      })
    ).id;

  /** Adds a project to a CV straight in the database; returns the CV project id. */
  const insertCvProject = async (
    cvId: string,
    projectId: string,
    dates: { startDate?: string; endDate?: string | null } = {},
  ) =>
    (
      await t.prisma.cvProject.create({
        data: {
          cvId,
          projectId,
          startDate: new Date(dates.startDate ?? '2026-02-01'),
          endDate: dates.endDate ? new Date(dates.endDate) : null,
          roles: { create: [{ roleId: developer }] },
        },
        select: { id: true },
      })
    ).id;

  const input = (cvId: string, projectId: string, overrides: Record<string, unknown> = {}) => ({
    cvId,
    projectId,
    startDate: '2026-02-01',
    endDate: '2026-06-30',
    roleIds: [developer],
    responsibilities: 'Wrote the API\nSet up CI',
    ...overrides,
  });

  const list = (browser: GqlClient, variables: Record<string, unknown>) =>
    browser
      .data<{ cvProjects: GqlCvProjectList }>(CV_PROJECTS, variables)
      .then((data) => data.cvProjects);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    ({ id: developer } = await t.prisma.projectRole.create({ data: { name: 'Developer' } }));
    ({ id: teamLead } = await t.prisma.projectRole.create({ data: { name: 'Team Lead' } }));
    const category = await t.prisma.skillCategory.create({
      data: { name: 'Frameworks', type: 'Frameworks' },
    });
    ({ id: react } = await t.prisma.skill.create({
      data: { name: 'React', categoryId: category.id },
    }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('access', () => {
    it('requires authentication', async () => {
      const error = await client().error(CV_PROJECTS, { cvId: MISSING_ID });

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it("rejects an Employee on another user's CV with FORBIDDEN and changes nothing", async () => {
      const { browser } = await signedIn();
      const other = await createUser(t.prisma);
      const cvId = await insertCv(other.id);
      const projectId = await insertProject();
      const cvProjectId = await insertCvProject(cvId, projectId);

      const errors = await Promise.all([
        browser.error(CV_PROJECTS, { cvId }),
        browser.error(AVAILABLE, { cvId }),
        browser.error(CREATE, { input: input(cvId, await insertProject('Payroll')) }),
        browser.error(UPDATE, {
          input: { id: cvProjectId, cvId, startDate: '2026-03-01', roleIds: [teamLead] },
        }),
        browser.error(DELETE, { id: cvProjectId, cvId }),
      ]);

      expect(errors.map((error) => error.extensions.code)).toEqual(Array(5).fill('FORBIDDEN'));
      expect(await t.prisma.cvProject.count()).toBe(1);
      const stored = await t.prisma.cvProject.findUnique({ where: { id: cvProjectId } });
      expect(stored?.startDate.toISOString().slice(0, 10)).toBe('2026-02-01');
    });

    it("lets an Admin manage another user's CV projects", async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const owner = await createUser(t.prisma);
      const cvId = await insertCv(owner.id);

      await browser.data(CREATE, { input: input(cvId, await insertProject()) });

      expect((await list(browser, { cvId })).total).toBe(1);
    });

    it('fails with NOT_FOUND for a CV that does not exist', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(CV_PROJECTS, { cvId: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('cvProjects', () => {
    it('lists only the projects of this CV with project data, roles and dates', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const otherCvId = await insertCv(user.id);
      const projectId = await insertProject('CV Builder');
      await insertCvProject(cvId, projectId);
      await insertCvProject(otherCvId, await insertProject('Payroll'));

      const result = await list(browser, { cvId });

      expect(result).toMatchObject({
        total: 1,
        items: [
          {
            startDate: '2026-02-01',
            endDate: null,
            roles: [{ name: 'Developer' }],
            project: { id: projectId, name: 'CV Builder', technologies: [{ name: 'React' }] },
          },
        ],
      });
    });

    it('searches by project name or domain, case-insensitively', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await insertCvProject(cvId, await insertProject('CV Builder', 'HR'));
      await insertCvProject(cvId, await insertProject('Payroll', 'Finance'));

      const byName = await list(browser, { cvId, search: 'PAY' });
      const byDomain = await list(browser, { cvId, search: 'hr' });

      expect(byName.items.map((item) => item.project.name)).toEqual(['Payroll']);
      expect(byDomain.items.map((item) => item.project.name)).toEqual(['CV Builder']);
    });

    it('sorts by end date with "Till now" as the latest', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await insertCvProject(cvId, await insertProject('Ongoing'), { endDate: null });
      await insertCvProject(cvId, await insertProject('Early'), { endDate: '2026-03-01' });
      await insertCvProject(cvId, await insertProject('Late'), { endDate: '2026-09-01' });

      const names = async (sortOrder: string) =>
        (await list(browser, { cvId, sortBy: 'endDate', sortOrder })).items.map(
          (item) => item.project.name,
        );

      expect(await names('ASC')).toEqual(['Early', 'Late', 'Ongoing']);
      expect(await names('DESC')).toEqual(['Ongoing', 'Late', 'Early']);
    });
  });

  describe('availableCvProjects', () => {
    it('returns catalog projects not yet in the CV', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      await insertCvProject(cvId, await insertProject('CV Builder'));
      await insertProject('Payroll');

      const { availableCvProjects } = await browser.data<{
        availableCvProjects: { name: string }[];
      }>(AVAILABLE, { cvId });

      expect(availableCvProjects.map((project) => project.name)).toEqual(['Payroll']);
    });
  });

  describe('createCvProject', () => {
    it('adds a project to own CV with roles and responsibilities', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const projectId = await insertProject();

      const { createCvProject } = await browser.data<{ createCvProject: GqlCvProject }>(CREATE, {
        input: input(cvId, projectId, { roleIds: [teamLead, developer] }),
      });

      expect(createCvProject).toMatchObject({
        startDate: '2026-02-01',
        endDate: '2026-06-30',
        responsibilities: 'Wrote the API\nSet up CI',
        roles: [{ name: 'Developer' }, { name: 'Team Lead' }],
        project: { id: projectId },
      });
      expect(await t.prisma.cvProjectRole.count()).toBe(2);
    });

    it('accepts no end date as "Till now"', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const { createCvProject } = await browser.data<{ createCvProject: GqlCvProject }>(CREATE, {
        input: input(cvId, await insertProject(), { endDate: null }),
      });

      expect(createCvProject.endDate).toBeNull();
    });

    it('rejects dates outside the project period with BAD_USER_INPUT and saves nothing', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const error = await browser.error(CREATE, {
        input: input(cvId, await insertProject(), {
          startDate: '2025-12-01',
          endDate: '2027-01-31',
        }),
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [
          { field: 'startDate', message: 'Start date must be within project duration' },
          { field: 'endDate', message: 'End date must be within project duration' },
        ],
      });
      expect(await t.prisma.cvProject.count()).toBe(0);
    });

    it('rejects an end date before the start date with BAD_USER_INPUT on endDate', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const error = await browser.error(CREATE, {
        input: input(cvId, await insertProject(), {
          startDate: '2026-06-01',
          endDate: '2026-02-01',
        }),
      });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'endDate', message: 'End date cannot be earlier than start date' }],
      });
    });

    it('rejects an empty role list and an unknown role with BAD_USER_INPUT on roleIds', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const projectId = await insertProject();

      const empty = await browser.error(CREATE, { input: input(cvId, projectId, { roleIds: [] }) });
      const unknown = await browser.error(CREATE, {
        input: input(cvId, projectId, { roleIds: [MISSING_ID] }),
      });

      expect(empty.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'roleIds', message: 'At least one role must be selected' }],
      });
      expect(unknown.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'roleIds', message: 'Role not found' }],
      });
      expect(await t.prisma.cvProject.count()).toBe(0);
    });

    it('rejects a project that does not exist with BAD_USER_INPUT on projectId', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const error = await browser.error(CREATE, { input: input(cvId, MISSING_ID) });

      expect(error.extensions).toMatchObject({
        code: 'BAD_USER_INPUT',
        fields: [{ field: 'projectId' }],
      });
    });

    it('rejects the same project twice in a CV with CONFLICT on projectId', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const projectId = await insertProject();
      await insertCvProject(cvId, projectId);

      const error = await browser.error(CREATE, { input: input(cvId, projectId) });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'projectId' });
      expect(await t.prisma.cvProject.count()).toBe(1);
    });
  });

  describe('updateCvProject', () => {
    it('changes dates, responsibilities and replaces the roles', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const id = await insertCvProject(cvId, await insertProject());

      const { updateCvProject } = await browser.data<{ updateCvProject: GqlCvProject }>(UPDATE, {
        input: {
          id,
          cvId,
          startDate: '2026-03-01',
          endDate: null,
          roleIds: [teamLead],
          responsibilities: '  ',
        },
      });

      expect(updateCvProject).toMatchObject({
        startDate: '2026-03-01',
        endDate: null,
        responsibilities: null,
        roles: [{ name: 'Team Lead' }],
      });
      expect(await t.prisma.cvProjectRole.count()).toBe(1);
    });

    it('does not accept a projectId: the project never changes', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const id = await insertCvProject(cvId, await insertProject());

      const error = await browser.error(UPDATE, {
        input: {
          id,
          cvId,
          projectId: await insertProject('Payroll'),
          startDate: '2026-03-01',
          roleIds: [developer],
        },
      });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
    });

    it('fails with NOT_FOUND for a CV project of another CV, even of the same owner', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const otherCvId = await insertCv(user.id);
      const id = await insertCvProject(otherCvId, await insertProject());

      const error = await browser.error(UPDATE, {
        input: { id, cvId, startDate: '2026-03-01', roleIds: [developer] },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteCvProject', () => {
    it('removes the project from the CV with its roles; the catalog project and roles stay', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);
      const projectId = await insertProject();
      const id = await insertCvProject(cvId, projectId);

      const { deleteCvProject } = await browser.data<{ deleteCvProject: string }>(DELETE, {
        id,
        cvId,
      });

      expect(deleteCvProject).toBe(id);
      expect(await t.prisma.cvProject.count()).toBe(0);
      expect(await t.prisma.cvProjectRole.count()).toBe(0);
      expect(await t.prisma.project.count({ where: { id: projectId } })).toBe(1);
      expect(await t.prisma.projectRole.count()).toBe(2);
    });

    it('fails with NOT_FOUND for a CV project that does not exist', async () => {
      const { browser, user } = await signedIn();
      const cvId = await insertCv(user.id);

      const error = await browser.error(DELETE, { id: MISSING_ID, cvId });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
