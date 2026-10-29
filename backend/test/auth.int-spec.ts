import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@/auth/sessions/auth-cookies';
import { MAX_CODE_ATTEMPTS } from '@/auth/email-verification/email-verification.service';
import { REFRESH_GRACE_SECONDS } from '@/auth/sessions/sessions.service';
import { AUTH_THROTTLE_LIMIT } from '@/common/throttling/throttle.decorators';
import { UserRole } from '@/common/graphql/enums';
import {
  ADMIN_PROBE,
  createUser,
  type GqlUser,
  LOGOUT,
  ME,
  PASSWORD,
  REFRESH,
  RESEND_CODE,
  SIGN_IN,
  SIGN_UP,
  signIn,
  uniqueEmail,
  VERIFIED_PROBE,
  VERIFY_EMAIL,
} from './utils/fixtures';
import { GqlClient } from './utils/graphql-client';
import { createTestApp, resetDatabase, type TestApp } from './utils/test-app';

describe('Auth (integration)', () => {
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

  describe('sign up and email verification', () => {
    it('creates an unverified Employee, signs them in and emails a verification code', async () => {
      const browser = client();
      const email = uniqueEmail();

      const { signUp } = await browser.data<{ signUp: GqlUser }>(SIGN_UP, {
        input: { email, password: PASSWORD, confirmPassword: PASSWORD },
      });

      expect(signUp).toMatchObject({ email, role: UserRole.EMPLOYEE, emailVerifiedAt: null });
      expect(browser.cookie(ACCESS_TOKEN_COOKIE)).toBeDefined();
      expect(browser.cookie(REFRESH_TOKEN_COOKIE)).toBeDefined();
      expect(t.mail.last(email, 'verification')).toMatch(/^\d{6}$/);

      const stored = await t.prisma.user.findUniqueOrThrow({ where: { email } });
      expect(stored.passwordHash).not.toContain(PASSWORD);
      await expect(browser.data(ME)).resolves.toEqual({ me: signUp });
    });

    it('rejects a taken email, whatever its letter case', async () => {
      const { email } = await createUser(t.prisma);

      const error = await client().error(SIGN_UP, {
        input: { email: email.toUpperCase(), password: PASSWORD, confirmPassword: PASSWORD },
      });

      expect(error.extensions).toMatchObject({ code: 'CONFLICT', field: 'email' });
      expect(error.message).toBe('An account with this email already exists');
    });

    it('validates the input on the server with field errors', async () => {
      const error = await client().error(SIGN_UP, {
        input: { email: 'nope', password: '123', confirmPassword: '124' },
      });

      expect(error.extensions.code).toBe('BAD_USER_INPUT');
      expect(error.extensions['fields']).toEqual(
        expect.arrayContaining([
          { field: 'email', message: 'Please enter a valid email address' },
          { field: 'password', message: 'Password must be at least 6 characters long' },
          { field: 'confirmPassword', message: 'Passwords do not match' },
        ]),
      );
    });

    it('keeps an unverified user read-only until the code is confirmed', async () => {
      const browser = client();
      const email = uniqueEmail();
      await browser.data(SIGN_UP, {
        input: { email, password: PASSWORD, confirmPassword: PASSWORD },
      });

      const blocked = await browser.error(VERIFIED_PROBE);
      expect(blocked.extensions.code).toBe('EMAIL_NOT_VERIFIED');

      const wrong = await browser.error(VERIFY_EMAIL, { input: { code: '000000' } });
      expect(wrong.message).toBe('Invalid verification code');

      const { verifyEmail } = await browser.data<{ verifyEmail: GqlUser }>(VERIFY_EMAIL, {
        input: { code: t.mail.last(email, 'verification') },
      });
      expect(verifyEmail.emailVerifiedAt).not.toBeNull();
      await expect(browser.data(VERIFIED_PROBE)).resolves.toEqual({ verifiedProbe: true });

      const again = await browser.error(VERIFY_EMAIL, {
        input: { code: t.mail.last(email, 'verification') },
      });
      expect(again.extensions.code).toBe('CONFLICT');
      expect(again.message).toBe('Email is already verified');
    });

    it('invalidates the previous code when a new one is sent', async () => {
      const browser = client();
      const email = uniqueEmail();
      await browser.data(SIGN_UP, {
        input: { email, password: PASSWORD, confirmPassword: PASSWORD },
      });
      const first = t.mail.last(email, 'verification');
      // The resend cooldown counts from the newest code; move it out of the way
      await t.prisma.authToken.updateMany({ data: { createdAt: new Date(Date.now() - 120_000) } });

      await browser.data(RESEND_CODE);
      const second = t.mail.last(email, 'verification');

      // Codes are random 6 digits, so compare the stored codes rather than hoping they differ
      const active = await t.prisma.authToken.count({
        where: { usedAt: null, expiresAt: { gt: new Date() } },
      });
      expect(active).toBe(1);
      expect(t.mail.sent.filter((mail) => mail.to === email)).toHaveLength(2);
      expect(first).toMatch(/^\d{6}$/);
      await expect(browser.data(VERIFY_EMAIL, { input: { code: second } })).resolves.toBeDefined();
    });

    it('stops accepting a code after 5 wrong attempts, until a new code is sent', async () => {
      const browser = client();
      const email = uniqueEmail();
      await browser.data(SIGN_UP, {
        input: { email, password: PASSWORD, confirmPassword: PASSWORD },
      });
      const code = t.mail.last(email, 'verification');
      const wrongCode = code === '000000' ? '111111' : '000000';

      for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt += 1) {
        const wrong = await browser.error(VERIFY_EMAIL, { input: { code: wrongCode } });
        expect(wrong.message).toBe('Invalid verification code');
      }
      const blocked = await browser.error(VERIFY_EMAIL, { input: { code } });
      expect(blocked.message).toBe('Verification code has expired');

      await t.prisma.authToken.updateMany({ data: { createdAt: new Date(Date.now() - 120_000) } });
      await browser.data(RESEND_CODE);
      await expect(
        browser.data(VERIFY_EMAIL, { input: { code: t.mail.last(email, 'verification') } }),
      ).resolves.toBeDefined();
    });

    it('rate-limits resending the code per account', async () => {
      const browser = client();
      await browser.data(SIGN_UP, {
        input: { email: uniqueEmail(), password: PASSWORD, confirmPassword: PASSWORD },
      });

      const error = await browser.error(RESEND_CODE);

      expect(error.extensions.code).toBe('RATE_LIMITED');
      expect(error.message).toBe('Please wait before requesting another code');
    });
  });

  describe('sign in, refresh and logout', () => {
    it('signs in with valid credentials and keeps the session in httpOnly cookies', async () => {
      const browser = client();
      const { email } = await createUser(t.prisma);

      await signIn(browser, email);

      await expect(browser.data<{ me: GqlUser }>(ME)).resolves.toMatchObject({ me: { email } });
    });

    it('gives the same answer for a wrong password and an unknown email', async () => {
      const { email } = await createUser(t.prisma);

      const wrongPassword = await client().error(SIGN_IN, {
        input: { email, password: 'wrong-password' },
      });
      const unknownEmail = await client().error(SIGN_IN, {
        input: { email: uniqueEmail('nobody'), password: PASSWORD },
      });

      expect(wrongPassword).toMatchObject({
        message: 'Invalid email or password',
        extensions: { code: 'UNAUTHENTICATED' },
      });
      expect(unknownEmail.message).toBe(wrongPassword.message);
      expect(unknownEmail.extensions.code).toBe(wrongPassword.extensions.code);
    });

    it('rotates the refresh token and rejects the old one after the grace period', async () => {
      const browser = client();
      const { email } = await createUser(t.prisma);
      await signIn(browser, email);
      const oldRefresh = browser.cookie(REFRESH_TOKEN_COOKIE) ?? '';

      await expect(browser.data(REFRESH)).resolves.toEqual({ refresh: true });
      expect(browser.cookie(REFRESH_TOKEN_COOKIE)).not.toBe(oldRefresh);
      await expect(browser.data(ME)).resolves.toBeDefined();

      await t.prisma.session.updateMany({
        data: { rotatedAt: new Date(Date.now() - REFRESH_GRACE_SECONDS * 1000) },
      });
      const replay = client();
      replay.setCookie(REFRESH_TOKEN_COOKIE, oldRefresh);
      const error = await replay.error(REFRESH);
      expect(error.extensions.code).toBe('UNAUTHENTICATED');
      expect(replay.cookie(REFRESH_TOKEN_COOKIE)).toBeUndefined();
    });

    it('keeps the session when two tabs refresh with the same token at once', async () => {
      const browser = client();
      const { email } = await createUser(t.prisma);
      await signIn(browser, email);
      const sharedRefresh = browser.cookie(REFRESH_TOKEN_COOKIE) ?? '';
      const otherTab = client();
      otherTab.setCookie(REFRESH_TOKEN_COOKIE, sharedRefresh);

      await expect(Promise.all([browser.send(REFRESH), otherTab.send(REFRESH)])).resolves.toEqual([
        { data: { refresh: true } },
        { data: { refresh: true } },
      ]);

      // Exactly one request rotated and set new cookies; the other one did not clear or replace them
      const tokens = [browser, otherTab].map((tab) => tab.cookie(REFRESH_TOKEN_COOKIE));
      expect(tokens).not.toContain(undefined);
      expect(tokens.filter((token) => token === sharedRefresh)).toHaveLength(1);
      const winner = tokens[0] === sharedRefresh ? otherTab : browser;
      await expect(winner.data(ME)).resolves.toMatchObject({ me: { email } });
    });

    it('logs out: clears the cookies and ends the session on the server', async () => {
      const browser = client();
      const { email } = await createUser(t.prisma);
      await signIn(browser, email);
      const accessToken = browser.cookie(ACCESS_TOKEN_COOKIE) ?? '';

      await expect(browser.data(LOGOUT)).resolves.toEqual({ logout: true });

      expect(browser.cookie(ACCESS_TOKEN_COOKIE)).toBeUndefined();
      const stolen = client();
      stolen.setCookie(ACCESS_TOKEN_COOKIE, accessToken);
      const error = await stolen.error(ME);
      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('access control', () => {
    it('rejects a request without a session', async () => {
      const error = await client().error(ME);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('rejects a forged access token', async () => {
      const browser = client();
      browser.setCookie(ACCESS_TOKEN_COOKIE, 'not-a-jwt');

      const error = await browser.error(ME);

      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });

    it('rejects an Employee on an admin-only operation and lets an Admin in', async () => {
      const employee = client();
      const admin = client();
      await signIn(employee, (await createUser(t.prisma)).email);
      await signIn(admin, (await createUser(t.prisma, { role: UserRole.ADMIN })).email);

      const error = await employee.error(ADMIN_PROBE);

      expect(error.extensions.code).toBe('FORBIDDEN');
      await expect(admin.data(ADMIN_PROBE)).resolves.toEqual({ adminProbe: true });
    });

    it('signs out a user whose account was deleted', async () => {
      const browser = client();
      const { id, email } = await createUser(t.prisma);
      await signIn(browser, email);

      await t.prisma.user.delete({ where: { id } });

      const error = await browser.error(ME);
      expect(error.extensions.code).toBe('UNAUTHENTICATED');
    });
  });

  describe('rate limiting', () => {
    it(`allows ${AUTH_THROTTLE_LIMIT} sign-in attempts per minute from one IP`, async () => {
      const attacker = client();
      const input = { email: uniqueEmail('target'), password: 'guess-123' };

      for (let attempt = 0; attempt < AUTH_THROTTLE_LIMIT; attempt += 1) {
        const error = await attacker.error(SIGN_IN, { input });
        expect(error.extensions.code).toBe('UNAUTHENTICATED');
      }
      const blocked = await attacker.error(SIGN_IN, { input });

      expect(blocked.extensions.code).toBe('RATE_LIMITED');
      expect(blocked.extensions['retryAfter']).toBeGreaterThan(0);
      const other = await client().error(SIGN_IN, { input });
      expect(other.extensions.code).toBe('UNAUTHENTICATED');
    });
  });
});
