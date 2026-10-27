import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { UserRole } from '@/common/graphql/enums';
import type { GqlContext } from '@/common/graphql/graphql.context';
import type { EnvironmentVariables } from '@/config/env.validation';
import type { User } from '@/users/models/user.model';
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from './auth-cookies';
import { AuthResolver } from './auth.resolver';
import type { AuthService } from './auth.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

const user = { id: 'user-1', role: UserRole.EMPLOYEE } as User;
const tokens = { accessToken: 'access', refreshToken: 'refresh' };
const input = { email: 'employee@cv-builder.local', password: 'secret123' };

const env: Record<string, unknown> = {
  NODE_ENV: 'development',
  JWT_ACCESS_TTL_SECONDS: 1800,
  REFRESH_TTL_DAYS: 1,
};

const createContext = (cookies: Record<string, string> = {}) => {
  const res = { cookie: jest.fn(), clearCookie: jest.fn() };
  const req = { cookies, headers: { 'user-agent': 'Firefox' } };
  const context = { req: req as unknown as Request, res: res as unknown as Response } as GqlContext;
  return { res, context };
};

describe('AuthResolver', () => {
  const auth = {
    signUp: jest.fn(),
    signIn: jest.fn(),
    refresh: jest.fn(),
    logout: jest.fn(),
  };
  const config = { get: jest.fn((key: string) => env[key]) };
  const resolver = new AuthResolver(
    auth as unknown as AuthService,
    config as unknown as ConfigService<EnvironmentVariables, true>,
  );

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('signUp sets both cookies and returns the user, never the tokens', async () => {
    auth.signUp.mockResolvedValue({ user, tokens });
    const { res, context } = createContext();

    await expect(resolver.signUp(input, context)).resolves.toBe(user);
    expect(auth.signUp).toHaveBeenCalledWith(input, 'Firefox');
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'access',
      expect.objectContaining({ httpOnly: true, secure: false, maxAge: 1_800_000 }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      'refresh',
      expect.objectContaining({ httpOnly: true, maxAge: 86_400_000 }),
    );
  });

  it('signIn sets both cookies and returns the user', async () => {
    auth.signIn.mockResolvedValue({ user, tokens });
    const { res, context } = createContext();

    await expect(resolver.signIn(input, context)).resolves.toBe(user);
    expect(res.cookie).toHaveBeenCalledTimes(2);
  });

  it('marks cookies secure in production', async () => {
    env['NODE_ENV'] = 'production';
    auth.signIn.mockResolvedValue({ user, tokens });
    const { res, context } = createContext();

    await resolver.signIn(input, context);

    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      'access',
      expect.objectContaining({ secure: true }),
    );
    env['NODE_ENV'] = 'development';
  });

  it('refresh reads the refresh cookie and replaces both cookies', async () => {
    auth.refresh.mockResolvedValue({ accessToken: 'access-2', refreshToken: 'refresh-2' });
    const { res, context } = createContext({ [REFRESH_TOKEN_COOKIE]: 'refresh' });

    await expect(resolver.refresh(context)).resolves.toBe(true);
    expect(auth.refresh).toHaveBeenCalledWith('refresh');
    expect(res.cookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, 'refresh-2', expect.any(Object));
  });

  it('refresh clears the cookies when the session is gone', async () => {
    auth.refresh.mockRejectedValue(new Error('UNAUTHENTICATED'));
    const { res, context } = createContext({ [REFRESH_TOKEN_COOKIE]: 'stale' });

    await expect(resolver.refresh(context)).rejects.toThrow('UNAUTHENTICATED');
    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, expect.any(Object));
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, expect.any(Object));
  });

  it('logout revokes the session and clears the cookies', async () => {
    const { res, context } = createContext({ [REFRESH_TOKEN_COOKIE]: 'refresh' });

    await expect(resolver.logout(context)).resolves.toBe(true);
    expect(auth.logout).toHaveBeenCalledWith('refresh');
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('logout still clears the cookies without a refresh cookie', async () => {
    const { res, context } = createContext();

    await expect(resolver.logout(context)).resolves.toBe(true);
    expect(auth.logout).toHaveBeenCalledWith(undefined);
    expect(res.clearCookie).toHaveBeenCalledTimes(2);
  });

  it('me returns the current user', () => {
    expect(resolver.me(user)).toBe(user);
  });
});
