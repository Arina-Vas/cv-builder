import { GraphQLError } from 'graphql';
import { hashPassword, verifyPassword } from '@/common/crypto/password';
import { ErrorCode } from '@/common/errors/error-code.enum';
import type { PrismaService } from '@/prisma/prisma.service';
import {
  ChangePasswordService,
  CURRENT_PASSWORD_INCORRECT_MESSAGE,
  SAME_PASSWORD_MESSAGE,
} from './change-password.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@/common/crypto/password', () => ({
  hashPassword: jest.fn(),
  verifyPassword: jest.fn(),
}));

const NOW = new Date('2026-11-16T12:00:00.000Z');
const USER_ID = 'user-1';
const SESSION_ID = 'session-1';

const errorOf = async (promise: Promise<unknown>): Promise<GraphQLError> => {
  const error: unknown = await promise.catch((caught: unknown) => caught);
  if (!(error instanceof GraphQLError)) {
    throw new Error('expected a GraphQLError');
  }
  return error;
};

describe('ChangePasswordService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), update: jest.fn() },
    session: { updateMany: jest.fn() },
    $transaction: jest.fn(),
  };
  const service = new ChangePasswordService(prisma as unknown as PrismaService);
  const verify = jest.mocked(verifyPassword);
  const hash = jest.mocked(hashPassword);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    prisma.user.findUnique.mockResolvedValue({ passwordHash: 'old-hash' });
    prisma.user.update.mockReturnValue('update-user');
    prisma.session.updateMany.mockReturnValue('revoke-sessions');
    prisma.$transaction.mockResolvedValue([]);
    verify.mockResolvedValue(true);
    hash.mockResolvedValue('new-hash');
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.resetAllMocks();
  });

  it('stores the new hash and revokes every other active session in one transaction', async () => {
    await expect(
      service.change(USER_ID, SESSION_ID, 'old-secret', 'new-secret'),
    ).resolves.toBeUndefined();

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: USER_ID },
      select: { passwordHash: true },
    });
    expect(verify).toHaveBeenCalledWith('old-hash', 'old-secret');
    expect(hash).toHaveBeenCalledWith('new-secret');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: USER_ID },
      data: { passwordHash: 'new-hash' },
    });
    expect(prisma.session.updateMany).toHaveBeenCalledWith({
      where: { userId: USER_ID, revokedAt: null, id: { not: SESSION_ID } },
      data: { revokedAt: NOW },
    });
    expect(prisma.$transaction).toHaveBeenCalledWith(['update-user', 'revoke-sessions']);
  });

  it('rejects an incorrect current password on the currentPassword field and changes nothing', async () => {
    verify.mockResolvedValue(false);

    const error = await errorOf(service.change(USER_ID, SESSION_ID, 'wrong', 'new-secret'));

    expect(error.message).toBe(CURRENT_PASSWORD_INCORRECT_MESSAGE);
    expect(error.extensions).toMatchObject({
      code: ErrorCode.BAD_USER_INPUT,
      fields: [{ field: 'currentPassword', message: CURRENT_PASSWORD_INCORRECT_MESSAGE }],
    });
    expect(hash).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('rejects a new password equal to the current one', async () => {
    const error = await errorOf(service.change(USER_ID, SESSION_ID, 'same-secret', 'same-secret'));

    expect(error.extensions).toMatchObject({
      code: ErrorCode.BAD_USER_INPUT,
      fields: [{ field: 'newPassword', message: SAME_PASSWORD_MESSAGE }],
    });
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('treats a user deleted mid-session as unauthenticated', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const error = await errorOf(service.change(USER_ID, SESSION_ID, 'old-secret', 'new-secret'));

    expect(error.extensions.code).toBe(ErrorCode.UNAUTHENTICATED);
    expect(verify).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
