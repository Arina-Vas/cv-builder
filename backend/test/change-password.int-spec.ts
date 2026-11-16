import {
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  SAME_PASSWORD_MESSAGE,
} from '@/auth/change-password/change-password.service';
import { CHANGE_PASSWORD, createUser, ME, PASSWORD, SIGN_IN, signIn } from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const NEW_PASSWORD = 'brand-new-secret';

const changeInput = (currentPassword: string, newPassword = NEW_PASSWORD) => ({
  input: { currentPassword, newPassword, confirmPassword: newPassword },
});

describe('Change password (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('replaces the password, keeps the current session and signs out the other ones', async () => {
    const { email } = await createUser(t.prisma);
    const laptop = client();
    const phone = client();
    await signIn(laptop, email);
    await signIn(phone, email);

    await expect(laptop.data(CHANGE_PASSWORD, changeInput(PASSWORD))).resolves.toEqual({
      changePassword: true,
    });

    await expect(laptop.data(ME)).resolves.toMatchObject({ me: { email } });
    expect((await phone.error(ME)).extensions.code).toBe('UNAUTHENTICATED');
    const oldPassword = await client().error(SIGN_IN, { input: { email, password: PASSWORD } });
    expect(oldPassword.extensions.code).toBe('UNAUTHENTICATED');
    await expect(signIn(client(), email, NEW_PASSWORD)).resolves.toBeDefined();
  });

  it('rejects an incorrect current password and leaves everything as it was', async () => {
    const { email } = await createUser(t.prisma);
    const laptop = client();
    const phone = client();
    await signIn(laptop, email);
    await signIn(phone, email);

    const error = await laptop.error(CHANGE_PASSWORD, changeInput('not-my-password'));

    expect(error).toMatchObject({
      message: CURRENT_PASSWORD_INCORRECT_MESSAGE,
      extensions: { code: 'BAD_USER_INPUT', fields: [{ field: 'currentPassword' }] },
    });
    await expect(phone.data(ME)).resolves.toMatchObject({ me: { email } });
    await expect(signIn(client(), email, PASSWORD)).resolves.toBeDefined();
  });

  it('rejects a new password equal to the current one', async () => {
    const { email } = await createUser(t.prisma);
    const laptop = client();
    await signIn(laptop, email);

    const error = await laptop.error(CHANGE_PASSWORD, changeInput(PASSWORD, PASSWORD));

    expect(error.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fields: [{ field: 'newPassword', message: SAME_PASSWORD_MESSAGE }],
    });
  });

  it('validates the input on the server', async () => {
    const { email } = await createUser(t.prisma);
    const laptop = client();
    await signIn(laptop, email);

    const error = await laptop.error(CHANGE_PASSWORD, {
      input: { currentPassword: PASSWORD, newPassword: NEW_PASSWORD, confirmPassword: 'typo' },
    });

    expect(error.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fields: [{ field: 'confirmPassword', message: 'Passwords do not match' }],
    });
    await expect(signIn(client(), email, PASSWORD)).resolves.toBeDefined();
  });

  it('requires a signed-in user', async () => {
    const error = await client().error(CHANGE_PASSWORD, changeInput(PASSWORD));

    expect(error.extensions.code).toBe('UNAUTHENTICATED');
  });

  it('requires a verified email', async () => {
    const { email } = await createUser(t.prisma, { verified: false });
    const laptop = client();
    await signIn(laptop, email);

    const error = await laptop.error(CHANGE_PASSWORD, changeInput(PASSWORD));

    expect(error.extensions.code).toBe('EMAIL_NOT_VERIFIED');
    await expect(signIn(client(), email, PASSWORD)).resolves.toBeDefined();
  });
});
