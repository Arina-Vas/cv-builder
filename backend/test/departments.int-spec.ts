import { UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const DEPARTMENTS = `query ($search: String) {
  departments(search: $search) { items { id name } total }
}`;
const CREATE_DEPARTMENT = `mutation ($input: CreateDepartmentInput!) { createDepartment(input: $input) { id name } }`;
const UPDATE_DEPARTMENT = `mutation ($input: UpdateDepartmentInput!) { updateDepartment(input: $input) { id name } }`;
const DELETE_DEPARTMENT = 'mutation ($id: ID!) { deleteDepartment(id: $id) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Departments (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const department = (name = 'Backend') => t.prisma.department.create({ data: { name } });
  const stored = (id: string) => t.prisma.department.findUnique({ where: { id } });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('departments', () => {
    it('requires authentication', async () => {
      const error = await client().error(DEPARTMENTS);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('lets an Employee read and search the list', async () => {
      const { browser } = await signedIn();
      await department('Backend');
      await department('Frontend');

      const { departments } = await browser.data<{
        departments: { items: { name: string }[]; total: number };
      }>(DEPARTMENTS, { search: 'front' });

      expect(departments).toMatchObject({ total: 1, items: [{ name: 'Frontend' }] });
    });
  });

  describe('createDepartment', () => {
    it('lets an Admin create a department', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const { createDepartment } = await browser.data<{ createDepartment: { id: string } }>(
        CREATE_DEPARTMENT,
        { input: { name: 'QA' } },
      );

      expect(await stored(createDepartment.id)).toMatchObject({ name: 'QA' });
    });

    it('rejects an Employee with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(CREATE_DEPARTMENT, { input: { name: 'QA' } });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await t.prisma.department.count()).toBe(0);
    });

    it('rejects an unverified Admin with EMAIL_NOT_VERIFIED', async () => {
      const admin = await createUser(t.prisma, { role: UserRole.ADMIN, verified: false });
      const browser = client();
      await signIn(browser, admin.email);

      const error = await browser.error(CREATE_DEPARTMENT, { input: { name: 'QA' } });

      expect(error.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('rejects a name that differs only in case with CONFLICT on name', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await department('Backend');

      const error = await browser.error(CREATE_DEPARTMENT, { input: { name: 'BACKEND' } });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'name' });
      expect(await t.prisma.department.count()).toBe(1);
    });
  });

  describe('updateDepartment', () => {
    it('lets an Admin rename a department and save it unchanged', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await department('Backend');

      await browser.data(UPDATE_DEPARTMENT, { input: { id, name: 'Platform' } });
      // wiki: saving without changes must not be a duplicate of itself
      await browser.data(UPDATE_DEPARTMENT, { input: { id, name: 'Platform' } });

      expect(await stored(id)).toMatchObject({ name: 'Platform' });
    });

    it('rejects an Employee with FORBIDDEN, unchanged', async () => {
      const { browser } = await signedIn();
      const { id } = await department('Backend');

      const error = await browser.error(UPDATE_DEPARTMENT, { input: { id, name: 'Platform' } });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).toMatchObject({ name: 'Backend' });
    });

    it('rejects a name taken by another department with CONFLICT on name', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await department('Backend');
      const { id } = await department('Frontend');

      const error = await browser.error(UPDATE_DEPARTMENT, { input: { id, name: 'backend' } });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'name' });
    });

    it('fails with NOT_FOUND for a department that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_DEPARTMENT, {
        input: { id: MISSING_ID, name: 'Platform' },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('deleteDepartment', () => {
    it('lets an Admin delete a department nobody has and returns its id', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await department();

      const { deleteDepartment } = await browser.data<{ deleteDepartment: string }>(
        DELETE_DEPARTMENT,
        { id },
      );

      expect(deleteDepartment).toBe(id);
      expect(await stored(id)).toBeNull();
    });

    it('rejects an Employee with FORBIDDEN and keeps the department', async () => {
      const { browser } = await signedIn();
      const { id } = await department();

      const error = await browser.error(DELETE_DEPARTMENT, { id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).not.toBeNull();
    });

    it('rejects a department assigned to a user with ENTITY_IN_USE and keeps it', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await department();
      const user = await createUser(t.prisma);
      await t.prisma.user.update({ where: { id: user.id }, data: { departmentId: id } });

      const error = await browser.error(DELETE_DEPARTMENT, { id });

      expect(error.extensions.code).toBe('ENTITY_IN_USE');
      expect(await stored(id)).not.toBeNull();
    });

    it('fails with NOT_FOUND for a department that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(DELETE_DEPARTMENT, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
