import { ResetLinkMessage } from '@/auth/password-reset/password-reset.messages';
import { AuthTokenType } from '@/generated/prisma/enums';
import {
  createUser,
  ME,
  PASSWORD,
  REQUEST_RESET,
  RESET_PASSWORD,
  SIGN_IN,
  signIn,
  uniqueEmail,
} from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

const NEW_PASSWORD = 'brand-new-secret';

describe('Password reset (integration)', () => {
  let t: TestApp;
  const client = () => new GqlClient(t.server);

  const tokenFromEmail = (email: string): string => {
    const link = new URL(t.mail.last(email, 'password-reset'));
    expect(`${link.origin}${link.pathname}`).toBe('http://localhost:3000/reset-password');
    return link.searchParams.get('token') ?? '';
  };

  beforeAll(async () => {
    t = await createTestApp();
  });

  beforeEach(async () => {
    await resetDatabase(t.prisma);
  });

  afterAll(async () => {
    await t.app.close();
  });

  it('answers the same for an unknown email and sends nothing', async () => {
    const email = uniqueEmail('nobody');

    await expect(client().data(REQUEST_RESET, { input: { email } })).resolves.toEqual({
      requestPasswordReset: true,
    });
    expect(t.mail.sent.filter((mail) => mail.to === email)).toHaveLength(0);
  });

  it('replaces the password, signs out every session and keeps the link single-use', async () => {
    const { email } = await createUser(t.prisma);
    const laptop = client();
    await signIn(laptop, email);

    await expect(client().data(REQUEST_RESET, { input: { email } })).resolves.toEqual({
      requestPasswordReset: true,
    });
    const token = tokenFromEmail(email);
    const stored = await t.prisma.authToken.findFirstOrThrow({
      where: { type: AuthTokenType.PASSWORD_RESET },
    });
    expect(stored.codeHash).not.toBe(token);

    await expect(
      client().data(RESET_PASSWORD, {
        input: { token, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
      }),
    ).resolves.toEqual({ resetPassword: true });

    expect((await laptop.error(ME)).extensions.code).toBe('UNAUTHENTICATED');
    const oldPassword = await client().error(SIGN_IN, { input: { email, password: PASSWORD } });
    expect(oldPassword.extensions.code).toBe('UNAUTHENTICATED');
    await expect(signIn(client(), email, NEW_PASSWORD)).resolves.toBeDefined();

    const reused = await client().error(RESET_PASSWORD, {
      input: { token, newPassword: 'another-secret', confirmPassword: 'another-secret' },
    });
    expect(reused).toMatchObject({
      message: ResetLinkMessage.invalid,
      extensions: { code: 'BAD_USER_INPUT', fields: [{ field: 'token' }] },
    });
  });

  it('rejects an expired link and leaves the password unchanged', async () => {
    const { email } = await createUser(t.prisma);
    await client().data(REQUEST_RESET, { input: { email } });
    const token = tokenFromEmail(email);
    await t.prisma.authToken.updateMany({ data: { expiresAt: new Date(Date.now() - 1000) } });

    const error = await client().error(RESET_PASSWORD, {
      input: { token, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
    });

    expect(error.message).toBe(ResetLinkMessage.expired);
    await expect(signIn(client(), email, PASSWORD)).resolves.toBeDefined();
  });

  it('rejects a confirmation that differs from the new password and keeps the link usable', async () => {
    const { email } = await createUser(t.prisma);
    await client().data(REQUEST_RESET, { input: { email } });
    const token = tokenFromEmail(email);

    const error = await client().error(RESET_PASSWORD, {
      input: { token, newPassword: NEW_PASSWORD, confirmPassword: `${NEW_PASSWORD}-typo` },
    });

    expect(error.extensions).toMatchObject({
      code: 'BAD_USER_INPUT',
      fields: [{ field: 'confirmPassword', message: 'Passwords do not match' }],
    });
    await expect(signIn(client(), email, PASSWORD)).resolves.toBeDefined();
    await expect(
      client().data(RESET_PASSWORD, {
        input: { token, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
      }),
    ).resolves.toEqual({ resetPassword: true });
  });

  it('rejects a link that was never issued', async () => {
    const error = await client().error(RESET_PASSWORD, {
      input: { token: 'x'.repeat(43), newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
    });

    expect(error.message).toBe(ResetLinkMessage.invalid);
  });

  it('keeps only the newest link valid', async () => {
    const { email } = await createUser(t.prisma);
    await client().data(REQUEST_RESET, { input: { email } });
    const first = tokenFromEmail(email);
    // The per-account cooldown counts from the newest link; move it out of the way
    await t.prisma.authToken.updateMany({ data: { createdAt: new Date(Date.now() - 120_000) } });
    await client().data(REQUEST_RESET, { input: { email } });

    const error = await client().error(RESET_PASSWORD, {
      input: { token: first, newPassword: NEW_PASSWORD, confirmPassword: NEW_PASSWORD },
    });

    expect(error.message).toBe(ResetLinkMessage.expired);
    await expect(
      client().data(RESET_PASSWORD, {
        input: {
          token: tokenFromEmail(email),
          newPassword: NEW_PASSWORD,
          confirmPassword: NEW_PASSWORD,
        },
      }),
    ).resolves.toEqual({ resetPassword: true });
  });

  it('ignores a repeated request within the cooldown without revealing it', async () => {
    const { email } = await createUser(t.prisma);
    await client().data(REQUEST_RESET, { input: { email } });

    await expect(client().data(REQUEST_RESET, { input: { email } })).resolves.toEqual({
      requestPasswordReset: true,
    });
    expect(t.mail.sent.filter((mail) => mail.to === email)).toHaveLength(1);
  });
});
