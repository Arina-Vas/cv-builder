import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { GraphQLError } from 'graphql';
import { verifyPassword } from '@/common/crypto/password';
import { hashToken } from '@/common/crypto/tokens';
import { ErrorCode } from '@/common/errors/error-code.enum';
import type { EnvironmentVariables } from '@/config/env.validation';
import { AuthTokenType } from '@/generated/prisma/enums';
import type { MailService } from '@/mail/mail.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { UsersService } from '@/users/users.service';
import { ResetLinkMessage } from './password-reset.messages';
import {
  PasswordResetService,
  REQUEST_COOLDOWN_SECONDS,
  RESET_TOKEN_TTL_MINUTES,
} from './password-reset.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const NOW = new Date('2026-10-28T12:00:00.000Z');
const MINUTE_MS = 60 * 1000;
const TOKEN = 'a'.repeat(43);

const errorOf = async (promise: Promise<unknown>): Promise<GraphQLError> => {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof GraphQLError)) {
    throw new Error('expected a GraphQLError');
  }
  return error;
};

describe('PasswordResetService', () => {
  const tx = {
    authToken: { updateMany: jest.fn() },
    user: { update: jest.fn() },
    session: { updateMany: jest.fn() },
  };
  const prisma = {
    authToken: { updateMany: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const users = { findByEmail: jest.fn() };
  const mail = { sendPasswordReset: jest.fn() };
  const config = { get: jest.fn() };
  const service = new PasswordResetService(
    prisma as unknown as PrismaService,
    users as unknown as UsersService,
    mail as unknown as MailService,
    config as unknown as ConfigService<EnvironmentVariables, true>,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    config.get.mockReturnValue('http://localhost:3000');
    mail.sendPasswordReset.mockResolvedValue(undefined);
    prisma.authToken.updateMany.mockReturnValue('expire-previous');
    prisma.authToken.create.mockReturnValue('create-new');
    prisma.$transaction.mockImplementation((arg: unknown) =>
      typeof arg === 'function' ? (arg as (client: typeof tx) => unknown)(tx) : arg,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  describe('request', () => {
    const user = { id: 'user-1', email: 'employee@cv-builder.local' };

    it('does nothing for an unknown email', async () => {
      users.findByEmail.mockResolvedValue(null);

      await expect(service.request('nobody@cv-builder.local')).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('expires older links, stores the hash of a new token and emails the link', async () => {
      users.findByEmail.mockResolvedValue(user);
      prisma.authToken.findFirst.mockResolvedValue(null);

      await service.request(user.email);

      expect(prisma.authToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          type: AuthTokenType.PASSWORD_RESET,
          usedAt: null,
          expiresAt: { gt: NOW },
        },
        data: { expiresAt: NOW },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(['expire-previous', 'create-new']);

      const [to, link, minutes] = mail.sendPasswordReset.mock.calls[0] as [string, string, number];
      const token = new URL(link).searchParams.get('token') ?? '';
      expect(to).toBe(user.email);
      expect(link).toMatch(/^http:\/\/localhost:3000\/reset-password\?token=/);
      expect(token).toMatch(/^[\w-]{43}$/);
      expect(minutes).toBe(RESET_TOKEN_TTL_MINUTES);
      expect(prisma.authToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: AuthTokenType.PASSWORD_RESET,
          codeHash: hashToken(token),
          expiresAt: new Date(NOW.getTime() + RESET_TOKEN_TTL_MINUTES * MINUTE_MS),
        },
      });
    });

    it('silently skips a repeated request within the cooldown', async () => {
      users.findByEmail.mockResolvedValue(user);
      prisma.authToken.findFirst.mockResolvedValue({
        createdAt: new Date(NOW.getTime() - (REQUEST_COOLDOWN_SECONDS - 1) * 1000),
      });

      await expect(service.request(user.email)).resolves.toBeUndefined();
      expect(prisma.$transaction).not.toHaveBeenCalled();
      expect(mail.sendPasswordReset).not.toHaveBeenCalled();
    });

    it('sends a new link once the cooldown has passed', async () => {
      users.findByEmail.mockResolvedValue(user);
      prisma.authToken.findFirst.mockResolvedValue({
        createdAt: new Date(NOW.getTime() - REQUEST_COOLDOWN_SECONDS * 1000),
      });

      await service.request(user.email);

      expect(mail.sendPasswordReset).toHaveBeenCalledTimes(1);
    });

    it('resolves even when the email cannot be sent, and logs the failure without the link', async () => {
      const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
      users.findByEmail.mockResolvedValue(user);
      prisma.authToken.findFirst.mockResolvedValue(null);
      mail.sendPasswordReset.mockRejectedValue(new Error('SMTP down'));

      await expect(service.request(user.email)).resolves.toBeUndefined();
      await Promise.resolve();

      expect(warn).toHaveBeenCalledTimes(1);
      const [message] = warn.mock.calls[0] as [string];
      expect(message).toBe('Failed to send password reset email to user user-1');
    });
  });

  describe('reset', () => {
    const stored = {
      id: 'token-1',
      userId: 'user-1',
      expiresAt: new Date(NOW.getTime() + MINUTE_MS),
      usedAt: null,
    };

    it('looks the token up by its hash', async () => {
      prisma.authToken.findFirst.mockResolvedValue(stored);
      tx.authToken.updateMany.mockResolvedValue({ count: 1 });

      await service.reset(TOKEN, 'new-secret');

      expect(prisma.authToken.findFirst).toHaveBeenCalledWith({
        where: { type: AuthTokenType.PASSWORD_RESET, codeHash: hashToken(TOKEN) },
        select: { id: true, userId: true, expiresAt: true, usedAt: true },
      });
    });

    it('marks the token used, stores the new password hash and revokes every session', async () => {
      prisma.authToken.findFirst.mockResolvedValue(stored);
      tx.authToken.updateMany.mockResolvedValue({ count: 1 });

      await service.reset(TOKEN, 'new-secret');

      expect(tx.authToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-1', usedAt: null },
        data: { usedAt: NOW },
      });
      const [{ where, data }] = tx.user.update.mock.calls[0] as [
        { where: { id: string }; data: { passwordHash: string } },
      ];
      expect(where).toEqual({ id: 'user-1' });
      expect(data.passwordHash).not.toBe('new-secret');
      await expect(verifyPassword(data.passwordHash, 'new-secret')).resolves.toBe(true);
      expect(tx.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: NOW },
      });
    });

    it.each([
      ['unknown', null],
      ['already used', { ...stored, usedAt: new Date(NOW.getTime() - MINUTE_MS) }],
    ])('rejects an %s token as invalid', async (_, token) => {
      prisma.authToken.findFirst.mockResolvedValue(token);

      const error = await errorOf(service.reset(TOKEN, 'new-secret'));

      expect(error.message).toBe(ResetLinkMessage.invalid);
      expect(error.extensions).toEqual({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'token', message: ResetLinkMessage.invalid }],
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects an expired token', async () => {
      prisma.authToken.findFirst.mockResolvedValue({ ...stored, expiresAt: NOW });

      const error = await errorOf(service.reset(TOKEN, 'new-secret'));

      expect(error.message).toBe(ResetLinkMessage.expired);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects a token used by a concurrent request without changing the password', async () => {
      prisma.authToken.findFirst.mockResolvedValue(stored);
      tx.authToken.updateMany.mockResolvedValue({ count: 0 });

      const error = await errorOf(service.reset(TOKEN, 'new-secret'));

      expect(error.message).toBe(ResetLinkMessage.invalid);
      expect(tx.user.update).not.toHaveBeenCalled();
      expect(tx.session.updateMany).not.toHaveBeenCalled();
    });
  });
});
