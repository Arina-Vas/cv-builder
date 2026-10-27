import { GraphQLError } from 'graphql';
import { hashPassword } from '@/common/crypto/password';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import { Prisma } from '@/generated/prisma/client';
import type { User } from '@/users/models/user.model';
import type { UsersService } from '@/users/users.service';
import type { AccessTokenService } from './access-token.service';
import { AuthService, EMAIL_TAKEN_MESSAGE, INVALID_CREDENTIALS_MESSAGE } from './auth.service';
import type { SessionsService } from './sessions.service';

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
  emailVerifiedAt: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

const input = { email: user.email, password: 'secret123' };

const errorOf = async (promise: Promise<unknown>): Promise<GraphQLError> => {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof GraphQLError)) {
    throw new Error('expected a GraphQLError');
  }
  return error;
};

describe('AuthService', () => {
  const users = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    findWithPasswordHashByEmail: jest.fn(),
  };
  const sessions = { create: jest.fn(), rotate: jest.fn(), revokeByRefreshToken: jest.fn() };
  const accessTokens = { sign: jest.fn() };
  const service = new AuthService(
    users as unknown as UsersService,
    sessions as unknown as SessionsService,
    accessTokens as unknown as AccessTokenService,
  );

  beforeEach(() => {
    sessions.create.mockResolvedValue({ sessionId: 'session-1', refreshToken: 'refresh' });
    accessTokens.sign.mockResolvedValue('access');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('signUp', () => {
    it('creates the user with a hashed password and starts a session', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockResolvedValue(user);

      const result = await service.signUp(input, 'Firefox');

      const { email, passwordHash } = users.create.mock.calls[0][0] as {
        email: string;
        passwordHash: string;
      };
      expect(email).toBe(user.email);
      expect(passwordHash).not.toBe('secret123');
      expect(passwordHash.startsWith('$argon2id$')).toBe(true);
      expect(sessions.create).toHaveBeenCalledWith('user-1', 'Firefox');
      expect(accessTokens.sign).toHaveBeenCalledWith('user-1', 'session-1');
      expect(result).toEqual({ user, tokens: { accessToken: 'access', refreshToken: 'refresh' } });
    });

    it('rejects an email that is already registered', async () => {
      users.findByEmail.mockResolvedValue(user);

      const error = await errorOf(service.signUp(input));

      expect(error.extensions).toEqual({ code: ErrorCode.CONFLICT, field: 'email' });
      expect(error.message).toBe(EMAIL_TAKEN_MESSAGE);
      expect(users.create).not.toHaveBeenCalled();
    });

    it('turns a unique violation from a parallel sign-up into the same conflict', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      const error = await errorOf(service.signUp(input));

      expect(error.extensions['code']).toBe(ErrorCode.CONFLICT);
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('rethrows other database errors', async () => {
      users.findByEmail.mockResolvedValue(null);
      users.create.mockRejectedValue(new Error('connection lost'));

      await expect(service.signUp(input)).rejects.toThrow('connection lost');
    });
  });

  describe('signIn', () => {
    let passwordHash: string;

    beforeAll(async () => {
      passwordHash = await hashPassword('secret123');
    });

    it('starts a session for correct credentials', async () => {
      users.findWithPasswordHashByEmail.mockResolvedValue({ id: 'user-1', passwordHash });
      users.findById.mockResolvedValue(user);

      const result = await service.signIn(input, 'Firefox');

      expect(sessions.create).toHaveBeenCalledWith('user-1', 'Firefox');
      expect(result.user).toBe(user);
    });

    it('rejects a wrong password with the generic message', async () => {
      users.findWithPasswordHashByEmail.mockResolvedValue({ id: 'user-1', passwordHash });

      const error = await errorOf(service.signIn({ ...input, password: 'wrong-password' }));

      expect(error.extensions['code']).toBe(ErrorCode.UNAUTHENTICATED);
      expect(error.message).toBe(INVALID_CREDENTIALS_MESSAGE);
      expect(sessions.create).not.toHaveBeenCalled();
    });

    it('gives the same answer for an unknown email, so emails cannot be enumerated', async () => {
      users.findWithPasswordHashByEmail.mockResolvedValue(null);

      const error = await errorOf(service.signIn(input));

      expect(error.extensions['code']).toBe(ErrorCode.UNAUTHENTICATED);
      expect(error.message).toBe(INVALID_CREDENTIALS_MESSAGE);
      expect(users.findById).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('returns a new access token and the rotated refresh token', async () => {
      sessions.rotate.mockResolvedValue({
        sessionId: 'session-1',
        userId: 'user-1',
        refreshToken: 'next',
      });

      await expect(service.refresh('refresh')).resolves.toEqual({
        accessToken: 'access',
        refreshToken: 'next',
      });
      expect(accessTokens.sign).toHaveBeenCalledWith('user-1', 'session-1');
    });

    it('rejects a missing refresh token', async () => {
      const error = await errorOf(service.refresh(undefined));

      expect(error.extensions['code']).toBe(ErrorCode.UNAUTHENTICATED);
      expect(sessions.rotate).not.toHaveBeenCalled();
    });

    it('rejects a refresh token that cannot be rotated', async () => {
      sessions.rotate.mockResolvedValue(null);

      const error = await errorOf(service.refresh('stale'));

      expect(error.extensions['code']).toBe(ErrorCode.UNAUTHENTICATED);
    });
  });

  describe('logout', () => {
    it('revokes the session of the refresh token', async () => {
      await service.logout('refresh');

      expect(sessions.revokeByRefreshToken).toHaveBeenCalledWith('refresh');
    });

    it('does nothing without a refresh token', async () => {
      await service.logout(undefined);

      expect(sessions.revokeByRefreshToken).not.toHaveBeenCalled();
    });
  });
});
