/**
 * Environment of the integration tests; it replaces the values from backend/.env.
 * CI can point TEST_DATABASE_URL at its own database.
 */
export const TEST_DATABASE_URL =
  process.env['TEST_DATABASE_URL'] ??
  'postgresql://cv_builder:cv_builder@localhost:5432/cv_builder_test?schema=public';

export const TEST_ENV: Record<string, string> = {
  NODE_ENV: 'test',
  DATABASE_URL: TEST_DATABASE_URL,
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'integration-tests-secret-at-least-32-chars',
  JWT_ACCESS_TTL_SECONDS: '1800',
  REFRESH_TTL_DAYS: '1',
  // Mail is replaced by FakeMailService; the transport is never used
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  MAIL_FROM: 'CV Builder <no-reply@cv-builder.local>',
  // Each test sends its own X-Forwarded-For, so rate limits do not leak between tests
  TRUST_PROXY_HOPS: '1',
};

/** The tests wipe every table, so refuse to run against anything but a *_test database. */
export const assertTestDatabase = (url: string): void => {
  const name = new URL(url).pathname.slice(1);
  if (!name.endsWith('_test')) {
    throw new Error(`Integration tests wipe the database; "${name}" does not end with _test`);
  }
};
