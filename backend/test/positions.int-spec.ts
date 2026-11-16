import { UserRole } from '@/common/graphql/enums';
import { createUser, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const DEPARTMENTS = `query ($search: String) {
  positions(search: $search) { items { id name } total }
}`;
const CREATE_DEPARTMENT = `mutation ($input: CreatePositionInput!) { createPosition(input: $input) { id name } }`;
const UPDATE_DEPARTMENT = `mutation ($input: UpdatePositionInput!) { updatePosition(input: $input) { id name } }`;
const DELETE_DEPARTMENT = 'mutation ($id: ID!) { deletePosition(id: $id) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

describe('Positions (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const position = (name = 'Developer') => t.prisma.position.create({ data: { name } });
  const stored = (id: string) => t.prisma.position.findUnique({ where: { id } });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('positions', () => {
    it('requires authentication', async () => {
      const error = await client().error(DEPARTMENTS);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('lets an Employee read and search the list', async () => {
      const { browser } = await signedIn();
      await position('Developer');
      await position('Designer');

      const { positions } = await browser.data<{
        positions: { items: { name: string }[]; total: number };
      }>(DEPARTMENTS, { search: 'design' });

      expect(positions).toMatchObject({ total: 1, items: [{ name: 'Designer' }] });
    });
  });

  describe('createPosition', () => {
    it('lets an Admin create a position', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const { createPosition } = await browser.data<{ createPosition: { id: string } }>(
        CREATE_DEPARTMENT,
        { input: { name: 'Tester' } },
      );

      expect(await stored(createPosition.id)).toMatchObject({ name: 'Tester' });
    });

    it('rejects an Employee with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(CREATE_DEPARTMENT, { input: { name: 'Tester' } });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await t.prisma.position.count()).toBe(0);
    });

    it('rejects an unverified Admin with EMAIL_NOT_VERIFIED', async () => {
      const admin = await createUser(t.prisma, { role: UserRole.ADMIN, verified: false });
      const browser = client();
      await signIn(browser, admin.email);

      const error = await browser.error(CREATE_DEPARTMENT, { input: { name: 'Tester' } });

      expect(error.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    });

    it('rejects a name that differs only in case with CONFLICT on name', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await position('Developer');

      const error = await browser.error(CREATE_DEPARTMENT, { input: { name: 'DEVELOPER' } });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'name' });
      expect(await t.prisma.position.count()).toBe(1);
    });
  });

  describe('updatePosition', () => {
    it('lets an Admin rename a position and save it unchanged', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await position('Developer');

      await browser.data(UPDATE_DEPARTMENT, { input: { id, name: 'Architect' } });
      // wiki: saving without changes must not be a duplicate of itself
      await browser.data(UPDATE_DEPARTMENT, { input: { id, name: 'Architect' } });

      expect(await stored(id)).toMatchObject({ name: 'Architect' });
    });

    it('rejects an Employee with FORBIDDEN, unchanged', async () => {
      const { browser } = await signedIn();
      const { id } = await position('Developer');

      const error = await browser.error(UPDATE_DEPARTMENT, { input: { id, name: 'Architect' } });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).toMatchObject({ name: 'Developer' });
    });

    it('rejects a name taken by another position with CONFLICT on name', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      await position('Developer');
      const { id } = await position('Designer');

      const error = await browser.error(UPDATE_DEPARTMENT, { input: { id, name: 'developer' } });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'name' });
    });

    it('fails with NOT_FOUND for a position that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_DEPARTMENT, {
        input: { id: MISSING_ID, name: 'Architect' },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });

  describe('deletePosition', () => {
    it('lets an Admin delete a position nobody has and returns its id', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await position();

      const { deletePosition } = await browser.data<{ deletePosition: string }>(DELETE_DEPARTMENT, {
        id,
      });

      expect(deletePosition).toBe(id);
      expect(await stored(id)).toBeNull();
    });

    it('rejects an Employee with FORBIDDEN and keeps the position', async () => {
      const { browser } = await signedIn();
      const { id } = await position();

      const error = await browser.error(DELETE_DEPARTMENT, { id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      expect(await stored(id)).not.toBeNull();
    });

    it('rejects a position assigned to a user with ENTITY_IN_USE and keeps it', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { id } = await position();
      const user = await createUser(t.prisma);
      await t.prisma.user.update({ where: { id: user.id }, data: { positionId: id } });

      const error = await browser.error(DELETE_DEPARTMENT, { id });

      expect(error.extensions.code).toBe('ENTITY_IN_USE');
      expect(await stored(id)).not.toBeNull();
    });

    it('fails with NOT_FOUND for a position that does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(DELETE_DEPARTMENT, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
