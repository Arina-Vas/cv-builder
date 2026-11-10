import { UserRole } from '@/common/graphql/enums';
import { UserMessage } from '@/users/user.messages';
import { createUser, ME, PASSWORD, signIn, uniqueEmail } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const FIELDS =
  'id email firstName lastName role emailVerifiedAt department { name } position { name }';

const USERS = `query ($search: String, $sortBy: UserSortField, $sortOrder: SortOrder, $page: Int!, $pageSize: Int!) {
  users(search: $search, sortBy: $sortBy, sortOrder: $sortOrder, page: $page, pageSize: $pageSize) {
    items { ${FIELDS} } page pageSize total
  }
}`;
const USER = `query ($id: ID!) { user(id: $id) { ${FIELDS} } }`;
const CREATE_USER = `mutation ($input: CreateUserInput!) { createUser(input: $input) { ${FIELDS} } }`;
const UPDATE_USER = `mutation ($input: UpdateUserInput!) { updateUser(input: $input) { ${FIELDS} } }`;
const DELETE_USER = 'mutation ($id: ID!) { deleteUser(id: $id) }';

const MISSING_ID = '00000000-0000-4000-8000-000000000000';

interface GqlListUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  emailVerifiedAt: string | null;
  department: { name: string } | null;
  position: { name: string } | null;
}

describe('Users (integration)', () => {
  let t: TestApp;
  let departmentId: string;
  let positionId: string;
  const client = () => new GqlClient(t.server);

  /** A signed-in browser of a new verified user with the given role. */
  const signedIn = async (role: UserRole = UserRole.EMPLOYEE) => {
    const user = await createUser(t.prisma, { role });
    const browser = client();
    await signIn(browser, user.email);
    return { browser, user };
  };

  const createInput = (overrides: Record<string, unknown> = {}) => ({
    email: uniqueEmail('created'),
    password: PASSWORD,
    firstName: 'Anna',
    lastName: 'Kovalenko',
    departmentId,
    positionId,
    role: UserRole.EMPLOYEE,
    ...overrides,
  });

  const listArgs = (overrides: Record<string, unknown> = {}) => ({
    page: 1,
    pageSize: 10,
    ...overrides,
  });

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
    ({ id: departmentId } = await t.prisma.department.create({ data: { name: 'Backend' } }));
    ({ id: positionId } = await t.prisma.position.create({ data: { name: 'Developer' } }));
  });

  afterAll(async () => {
    await t.app.close();
  });

  describe('users list', () => {
    it('requires authentication', async () => {
      const error = await client().error(USERS, listArgs());

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('is available to an Employee, with the page info and total', async () => {
      const { browser } = await signedIn();
      await createUser(t.prisma);

      const { users } = await browser.data<{
        users: { items: GqlListUser[]; page: number; pageSize: number; total: number };
      }>(USERS, listArgs({ pageSize: 10 }));

      expect(users).toMatchObject({ page: 1, pageSize: 10, total: 2 });
      expect(users.items).toHaveLength(2);
    });

    it('searches first name, last name and email case-insensitively', async () => {
      const { browser } = await signedIn();
      await t.prisma.user.update({
        where: { id: (await createUser(t.prisma)).id },
        data: { firstName: 'Olena' },
      });
      await t.prisma.user.update({
        where: { id: (await createUser(t.prisma)).id },
        data: { lastName: 'Olenko' },
      });
      await createUser(t.prisma, { email: 'oleh@cv-builder.test' });

      const { users } = await browser.data<{ users: { items: GqlListUser[]; total: number } }>(
        USERS,
        listArgs({ search: 'OLE' }),
      );

      expect(users.total).toBe(3);
    });

    it('sorts by department name and paginates, keeping users without one last for ASC', async () => {
      const { browser, user: me } = await signedIn();
      const qa = await t.prisma.department.create({ data: { name: 'QA' } });
      const [a, b] = [await createUser(t.prisma), await createUser(t.prisma)];
      await t.prisma.user.update({ where: { id: a.id }, data: { departmentId: qa.id } });
      await t.prisma.user.update({ where: { id: b.id }, data: { departmentId } });

      const first = await browser.data<{ users: { items: GqlListUser[]; total: number } }>(
        USERS,
        listArgs({ sortBy: 'department', sortOrder: 'ASC', pageSize: 10 }),
      );

      expect(first.users.items.map((user) => user.id)).toEqual([b.id, a.id, me.id]);
      expect(first.users.total).toBe(3);
    });

    it('sorts by creation date, newest first for DESC', async () => {
      const { browser, user: me } = await signedIn();
      const [older, newer] = [await createUser(t.prisma), await createUser(t.prisma)];
      await t.prisma.user.update({
        where: { id: me.id },
        data: { createdAt: new Date('2026-01-01T00:00:00Z') },
      });
      await t.prisma.user.update({
        where: { id: older.id },
        data: { createdAt: new Date('2026-02-01T00:00:00Z') },
      });
      await t.prisma.user.update({
        where: { id: newer.id },
        data: { createdAt: new Date('2026-03-01T00:00:00Z') },
      });

      const { users } = await browser.data<{ users: { items: GqlListUser[] } }>(
        USERS,
        listArgs({ sortBy: 'createdAt', sortOrder: 'DESC' }),
      );

      expect(users.items.map((user) => user.id)).toEqual([newer.id, older.id, me.id]);
    });

    it('rejects a sort field outside the enum', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(USERS, listArgs({ sortBy: 'passwordHash' }));

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
    });
  });

  describe('user', () => {
    it('returns the user without secrets', async () => {
      const { browser, user } = await signedIn();

      const body = await browser.send<{ user: Record<string, unknown> }>(USER, { id: user.id });

      expect(body.data?.user).toMatchObject({ id: user.id, email: user.email });
      expect(JSON.stringify(body)).not.toContain('passwordHash');
    });

    it('fails with NOT_FOUND when the user does not exist', async () => {
      const { browser } = await signedIn();

      const error = await browser.error(USER, { id: MISSING_ID });

      expect(error.extensions.code).toBe('NOT_FOUND');
      expect(error.message).toBe(UserMessage.notFound);
    });
  });

  describe('createUser', () => {
    it('lets an Admin create an unverified user with a hashed password', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const input = createInput({ role: UserRole.ADMIN });

      const { createUser: created } = await browser.data<{ createUser: GqlListUser }>(CREATE_USER, {
        input,
      });

      expect(created).toMatchObject({
        email: input.email,
        firstName: 'Anna',
        lastName: 'Kovalenko',
        role: UserRole.ADMIN,
        emailVerifiedAt: null,
        department: { name: 'Backend' },
        position: { name: 'Developer' },
      });
      const stored = await t.prisma.user.findUniqueOrThrow({ where: { id: created.id } });
      expect(stored.passwordHash).not.toContain(PASSWORD);

      // The new user can sign in with the password the Admin set
      await expect(signIn(client(), input.email)).resolves.toBeDefined();
    });

    it('rejects an Employee with FORBIDDEN and creates nothing', async () => {
      const { browser } = await signedIn();
      const input = createInput();

      const error = await browser.error(CREATE_USER, { input });

      expect(error.extensions.code).toBe('FORBIDDEN');
      await expect(t.prisma.user.findUnique({ where: { email: input.email } })).resolves.toBeNull();
    });

    it('fails with CONFLICT on a taken email, whatever its letter case', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const { email } = await createUser(t.prisma);

      const error = await browser.error(CREATE_USER, {
        input: createInput({ email: email.toUpperCase() }),
      });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'email' });
      expect(error.message).toBe(UserMessage.emailTaken);
    });

    it('fails with BAD_USER_INPUT when the department or position does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CREATE_USER, {
        input: createInput({ departmentId: MISSING_ID, positionId: MISSING_ID }),
      });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
      expect(error.extensions['fields']).toEqual([
        { field: 'departmentId', message: UserMessage.departmentNotFound },
        { field: 'positionId', message: UserMessage.positionNotFound },
      ]);
    });

    it('validates the input on the server with the modal texts', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(CREATE_USER, {
        input: createInput({ email: 'nope', password: '123', firstName: '', lastName: '' }),
      });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
      expect(error.extensions['fields']).toEqual(
        expect.arrayContaining([
          { field: 'email', message: 'Invalid email address' },
          { field: 'password', message: 'Password must contain at least 6 characters' },
          { field: 'firstName', message: 'First name is required' },
          { field: 'lastName', message: 'Last name is required' },
        ]),
      );
    });
  });

  describe('updateUser', () => {
    const names = { firstName: 'Jane', lastName: 'Doe' };

    it('lets an Admin change the names, department, position and role of another user', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const target = await createUser(t.prisma);
      const qa = await t.prisma.department.create({ data: { name: 'QA' } });

      const { updateUser } = await browser.data<{ updateUser: GqlListUser }>(UPDATE_USER, {
        input: { id: target.id, ...names, departmentId: qa.id, positionId, role: UserRole.ADMIN },
      });

      expect(updateUser).toMatchObject({
        id: target.id,
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.ADMIN,
        department: { name: 'QA' },
        position: { name: 'Developer' },
      });
    });

    it('rejects an Employee with FORBIDDEN', async () => {
      const { browser, user } = await signedIn();

      const error = await browser.error(UPDATE_USER, {
        input: { id: user.id, ...names, departmentId, positionId, role: UserRole.ADMIN },
      });

      expect(error.extensions.code).toBe('FORBIDDEN');
      await expect(
        t.prisma.user.findUniqueOrThrow({ where: { id: user.id } }),
      ).resolves.toMatchObject({ role: UserRole.EMPLOYEE });
    });

    it('fails with OPERATION_NOT_ALLOWED when an Admin changes their own role', async () => {
      const { browser, user } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_USER, {
        input: { id: user.id, ...names, departmentId, positionId, role: UserRole.EMPLOYEE },
      });

      expect(error.extensions.code).toBe('OPERATION_NOT_ALLOWED');
      expect(error.message).toBe(UserMessage.ownRoleChange);
    });

    it('lets an Admin change their own department while keeping the role', async () => {
      const { browser, user } = await signedIn(UserRole.ADMIN);

      const { updateUser } = await browser.data<{ updateUser: GqlListUser }>(UPDATE_USER, {
        input: { id: user.id, ...names, departmentId, positionId, role: UserRole.ADMIN },
      });

      expect(updateUser.department).toEqual({ name: 'Backend' });
    });

    it('fails with NOT_FOUND when the user does not exist', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(UPDATE_USER, {
        input: { id: MISSING_ID, ...names, departmentId, positionId, role: UserRole.EMPLOYEE },
      });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
    it('trims the names and rejects empty ones with BAD_USER_INPUT', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const target = await createUser(t.prisma);

      const { updateUser } = await browser.data<{ updateUser: GqlListUser }>(UPDATE_USER, {
        input: {
          id: target.id,
          firstName: '  Ann ',
          lastName: ' Lee  ',
          departmentId,
          positionId,
          role: UserRole.EMPLOYEE,
        },
      });
      expect(updateUser).toMatchObject({ firstName: 'Ann', lastName: 'Lee' });

      const error = await browser.error(UPDATE_USER, {
        input: {
          id: target.id,
          firstName: ' ',
          lastName: 'Lee',
          departmentId,
          positionId,
          role: UserRole.EMPLOYEE,
        },
      });
      expect(error.extensions.code).toBe('BAD_USER_INPUT');
      await expect(
        t.prisma.user.findUniqueOrThrow({ where: { id: target.id } }),
      ).resolves.toMatchObject({ firstName: 'Ann' });
    });
  });

  describe('deleteUser', () => {
    it('lets an Admin delete another user, whose session stops working', async () => {
      const { browser: admin } = await signedIn(UserRole.ADMIN);
      const { browser: victim, user } = await signedIn();

      await expect(admin.data(DELETE_USER, { id: user.id })).resolves.toEqual({
        deleteUser: user.id,
      });

      await expect(t.prisma.user.findUnique({ where: { id: user.id } })).resolves.toBeNull();
      const error = await victim.error(ME);
      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('rejects an Employee with FORBIDDEN', async () => {
      const { browser } = await signedIn();
      const target = await createUser(t.prisma);

      const error = await browser.error(DELETE_USER, { id: target.id });

      expect(error.extensions.code).toBe('FORBIDDEN');
      await expect(t.prisma.user.findUnique({ where: { id: target.id } })).resolves.not.toBeNull();
    });

    it('fails with OPERATION_NOT_ALLOWED when an Admin deletes their own account', async () => {
      const { browser, user } = await signedIn(UserRole.ADMIN);

      const error = await browser.error(DELETE_USER, { id: user.id });

      expect(error.extensions.code).toBe('OPERATION_NOT_ALLOWED');
      expect(error.message).toBe(UserMessage.ownAccountDelete);
    });

    it('fails with NOT_FOUND for a user that is already deleted', async () => {
      const { browser } = await signedIn(UserRole.ADMIN);
      const target = await createUser(t.prisma);
      await browser.data(DELETE_USER, { id: target.id });

      const error = await browser.error(DELETE_USER, { id: target.id });

      expect(error.extensions.code).toBe('NOT_FOUND');
    });
  });
});
