import 'reflect-metadata';
import { Environment, validate } from './env.validation';

const valid = {
  DATABASE_URL: 'postgresql://cv_builder:cv_builder@localhost:5432/cv_builder',
  FRONTEND_URL: 'http://localhost:3000',
  JWT_ACCESS_SECRET: 'x'.repeat(32),
  JWT_ACCESS_TTL_SECONDS: '1800',
  REFRESH_TTL_DAYS: '1',
  SMTP_HOST: 'localhost',
  SMTP_PORT: '1025',
  MAIL_FROM: 'CV Builder <no-reply@cv-builder.local>',
};

describe('validate (environment variables)', () => {
  it('converts numbers and fills in the defaults', () => {
    const env = validate(valid);

    expect(env).toMatchObject({
      NODE_ENV: Environment.Development,
      PORT: 4000,
      JWT_ACCESS_TTL_SECONDS: 1800,
      REFRESH_TTL_DAYS: 1,
      SMTP_PORT: 1025,
      TRUST_PROXY_HOPS: 0,
    });
  });

  it('refuses to start without a required variable', () => {
    const { DATABASE_URL: _missing, ...rest } = valid;

    expect(() => validate(rest)).toThrow('Invalid environment variables: DATABASE_URL');
  });

  it('names every invalid variable', () => {
    expect(() =>
      validate({ ...valid, JWT_ACCESS_SECRET: 'too-short', PORT: '70000', NODE_ENV: 'staging' }),
    ).toThrow('Invalid environment variables: NODE_ENV, PORT, JWT_ACCESS_SECRET');
  });

  it('rejects a negative number of proxies', () => {
    expect(() => validate({ ...valid, TRUST_PROXY_HOPS: '-1' })).toThrow('TRUST_PROXY_HOPS');
  });
});
