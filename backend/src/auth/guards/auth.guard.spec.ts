import type { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GraphQLError } from 'graphql';
import { ALLOW_UNVERIFIED_KEY } from '@/common/auth/allow-unverified.decorator';
import { IS_PUBLIC_KEY } from '@/common/auth/public.decorator';
import type { AuthenticatedRequest } from '@/common/auth/request';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import type { User } from '@/users/models/user.model';
import type { UsersService } from '@/users/users.service';
import type { AccessTokenService } from '../sessions/access-token.service';
import { AuthGuard } from './auth.guard';
import type { SessionsService } from '../sessions/sessions.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));
jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

const user: User = {
  id: 'user-1',
  email: 'employee@cv-builder.local',
  firstName: null,
  lastName: null,
  avatarUrl: null,
  role: UserRole.EMPLOYEE,
  department: null,
  position: null,
  emailVerifiedAt: new Date('2026-01-01T00:00:00.000Z'),
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const graphqlContext = (
  req: Partial<AuthenticatedRequest>,
  parentType: 'Query' | 'Mutation' = 'Query',
): ExecutionContext => {
  const args = [{}, {}, { req }, { parentType: { name: parentType } }];
  return {
    getType: () => 'graphql',
    getArgs: () => args,
    getArgByIndex: (index: number) => args[index],
    getHandler: () => () => undefined,
    getClass: () => class Resolver {},
  } as unknown as ExecutionContext;
};

const codeOf = async (promise: Promise<unknown>): Promise<unknown> => {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  return error instanceof GraphQLError ? error.extensions['code'] : error;
};

describe('AuthGuard', () => {
  const flags: Record<string, boolean> = {};
  const reflector = { getAllAndOverride: jest.fn((key: string) => flags[key]) };
  const accessTokens = { verify: jest.fn() };
  const sessions = { findActive: jest.fn() };
  const users = { findById: jest.fn() };
  const guard = new AuthGuard(
    reflector as unknown as Reflector,
    accessTokens as unknown as AccessTokenService,
    sessions as unknown as SessionsService,
    users as unknown as UsersService,
  );

  const signedIn = (current: User = user) => {
    accessTokens.verify.mockResolvedValue({ sub: 'user-1', sid: 'session-1' });
    sessions.findActive.mockResolvedValue({ id: 'session-1', userId: 'user-1' });
    users.findById.mockResolvedValue(current);
  };

  beforeEach(() => {
    for (const key of Object.keys(flags)) delete flags[key];
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('lets public operations through without a token', async () => {
    flags[IS_PUBLIC_KEY] = true;

    await expect(guard.canActivate(graphqlContext({ cookies: {} }))).resolves.toBe(true);
    expect(accessTokens.verify).not.toHaveBeenCalled();
  });

  it('puts the current user and session on the request', async () => {
    signedIn();
    const req: Partial<AuthenticatedRequest> = { cookies: { access_token: 'token' } };

    await expect(guard.canActivate(graphqlContext(req))).resolves.toBe(true);
    expect(accessTokens.verify).toHaveBeenCalledWith('token');
    expect(req.user).toBe(user);
    expect(req.sessionId).toBe('session-1');
  });

  it('rejects a request without the access token cookie', async () => {
    await expect(codeOf(guard.canActivate(graphqlContext({ cookies: {} })))).resolves.toBe(
      ErrorCode.UNAUTHENTICATED,
    );
  });

  it('rejects an invalid or expired access token', async () => {
    accessTokens.verify.mockResolvedValue(null);

    await expect(
      codeOf(guard.canActivate(graphqlContext({ cookies: { access_token: 'bad' } }))),
    ).resolves.toBe(ErrorCode.UNAUTHENTICATED);
  });

  it('rejects a token whose session was revoked or expired', async () => {
    signedIn();
    sessions.findActive.mockResolvedValue(null);

    await expect(
      codeOf(guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }))),
    ).resolves.toBe(ErrorCode.UNAUTHENTICATED);
  });

  it('rejects a token whose session belongs to another user', async () => {
    signedIn();
    sessions.findActive.mockResolvedValue({ id: 'session-1', userId: 'user-2' });

    await expect(
      codeOf(guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }))),
    ).resolves.toBe(ErrorCode.UNAUTHENTICATED);
  });

  it('rejects a token of a deleted user', async () => {
    signedIn();
    users.findById.mockResolvedValue(null);

    await expect(
      codeOf(guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }))),
    ).resolves.toBe(ErrorCode.UNAUTHENTICATED);
  });

  describe('unverified email', () => {
    const unverified = { ...user, emailVerifiedAt: null };

    it('allows queries', async () => {
      signedIn(unverified);

      await expect(
        guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }, 'Query')),
      ).resolves.toBe(true);
    });

    it('rejects mutations with EMAIL_NOT_VERIFIED', async () => {
      signedIn(unverified);

      await expect(
        codeOf(
          guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }, 'Mutation')),
        ),
      ).resolves.toBe(ErrorCode.EMAIL_NOT_VERIFIED);
    });

    it('allows mutations marked @AllowUnverified()', async () => {
      signedIn(unverified);
      flags[ALLOW_UNVERIFIED_KEY] = true;

      await expect(
        guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }, 'Mutation')),
      ).resolves.toBe(true);
    });
  });

  it('allows mutations for a verified user', async () => {
    signedIn();

    await expect(
      guard.canActivate(graphqlContext({ cookies: { access_token: 'token' } }, 'Mutation')),
    ).resolves.toBe(true);
  });
});
