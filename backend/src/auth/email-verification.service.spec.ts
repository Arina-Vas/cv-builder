import { GraphQLError } from 'graphql';
import { hashToken } from '@/common/crypto/tokens';
import { ErrorCode } from '@/common/errors/error-code.enum';
import { UserRole } from '@/common/graphql/enums';
import { AuthTokenType } from '@/generated/prisma/enums';
import type { MailService } from '@/mail/mail.service';
import type { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';
import type { UsersService } from '@/users/users.service';
import { EmailVerificationService, VerificationMessage } from './email-verification.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const NOW = new Date('2026-10-27T12:00:00.000Z');

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
  createdAt: NOW,
};

const errorOf = async (promise: Promise<unknown>): Promise<GraphQLError> => {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof GraphQLError)) {
    throw new Error('expected a GraphQLError');
  }
  return error;
};

describe('EmailVerificationService', () => {
  const tx = { authToken: { updateMany: jest.fn() }, user: { update: jest.fn() } };
  const prisma = {
    authToken: { updateMany: jest.fn(), create: jest.fn(), findFirst: jest.fn() },
    $transaction: jest.fn(),
  };
  const users = { findById: jest.fn() };
  const mail = { sendVerificationCode: jest.fn() };
  const service = new EmailVerificationService(
    prisma as unknown as PrismaService,
    users as unknown as UsersService,
    mail as unknown as MailService,
  );

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
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

  describe('sendCode', () => {
    it('expires older codes, stores the hash of a new one and emails the code', async () => {
      await service.sendCode('user-1', user.email);

      expect(prisma.authToken.updateMany).toHaveBeenCalledWith({
        where: {
          userId: 'user-1',
          type: AuthTokenType.EMAIL_VERIFICATION,
          usedAt: null,
          expiresAt: { gt: NOW },
        },
        data: { expiresAt: NOW },
      });
      expect(prisma.$transaction).toHaveBeenCalledWith(['expire-previous', 'create-new']);

      const [, code, minutes] = mail.sendVerificationCode.mock.calls[0] as [string, string, number];
      expect(code).toMatch(/^\d{6}$/);
      expect(minutes).toBe(10);
      expect(prisma.authToken.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          type: AuthTokenType.EMAIL_VERIFICATION,
          codeHash: hashToken(code),
          expiresAt: new Date('2026-10-27T12:10:00.000Z'),
        },
      });
    });
  });

  describe('resend', () => {
    it('sends a new code when the cooldown has passed', async () => {
      prisma.authToken.findFirst.mockResolvedValue({
        createdAt: new Date('2026-10-27T11:58:00.000Z'),
      });

      await service.resend(user);

      expect(mail.sendVerificationCode).toHaveBeenCalledWith(user.email, expect.any(String), 10);
    });

    it('asks to wait during the cooldown and says how long', async () => {
      prisma.authToken.findFirst.mockResolvedValue({
        createdAt: new Date('2026-10-27T11:59:40.000Z'),
      });

      const error = await errorOf(service.resend(user));

      expect(error.extensions).toEqual({ code: ErrorCode.RATE_LIMITED, retryAfter: 40 });
      expect(error.message).toBe(VerificationMessage.wait);
      expect(mail.sendVerificationCode).not.toHaveBeenCalled();
    });

    it('rejects a user whose email is already verified', async () => {
      const error = await errorOf(service.resend({ ...user, emailVerifiedAt: NOW }));

      expect(error.message).toBe(VerificationMessage.alreadyVerified);
    });
  });

  describe('verify', () => {
    const token = (overrides: Partial<{ expiresAt: Date; usedAt: Date | null }> = {}) => ({
      id: 'token-1',
      expiresAt: new Date('2026-10-27T12:05:00.000Z'),
      usedAt: null,
      ...overrides,
    });

    it('marks the email verified and the code used in one transaction', async () => {
      const verified = { ...user, emailVerifiedAt: NOW };
      prisma.authToken.findFirst.mockResolvedValue(token());
      tx.authToken.updateMany.mockResolvedValue({ count: 1 });
      users.findById.mockResolvedValue(verified);

      await expect(service.verify(user, '042917')).resolves.toBe(verified);
      expect(prisma.authToken.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: 'user-1',
            type: AuthTokenType.EMAIL_VERIFICATION,
            codeHash: hashToken('042917'),
          },
        }),
      );
      expect(tx.authToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'token-1', usedAt: null },
        data: { usedAt: NOW },
      });
      expect(tx.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { emailVerifiedAt: NOW },
      });
    });

    it.each([
      ['an unknown code', null, VerificationMessage.invalid],
      ['a used code', token({ usedAt: NOW }), VerificationMessage.used],
      ['an expired code', token({ expiresAt: NOW }), VerificationMessage.expired],
    ])('rejects %s', async (_, found, message) => {
      prisma.authToken.findFirst.mockResolvedValue(found);

      const error = await errorOf(service.verify(user, '042917'));

      expect(error.extensions).toEqual({
        code: ErrorCode.BAD_USER_INPUT,
        fields: [{ field: 'code', message }],
      });
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    it('rejects a code used by a parallel request', async () => {
      prisma.authToken.findFirst.mockResolvedValue(token());
      tx.authToken.updateMany.mockResolvedValue({ count: 0 });

      const error = await errorOf(service.verify(user, '042917'));

      expect(error.message).toBe(VerificationMessage.used);
      expect(tx.user.update).not.toHaveBeenCalled();
    });

    it('rejects a user whose email is already verified', async () => {
      const error = await errorOf(service.verify({ ...user, emailVerifiedAt: NOW }, '042917'));

      expect(error.extensions['code']).toBe(ErrorCode.CONFLICT);
      expect(error.message).toBe(VerificationMessage.alreadyVerified);
      expect(prisma.authToken.findFirst).not.toHaveBeenCalled();
    });
  });
});
