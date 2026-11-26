import { Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { AuthCleanupService, CLEANUP_RETENTION_DAYS } from './auth-cleanup.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));

const NOW = new Date('2026-11-26T03:00:00.000Z');
const CUTOFF = new Date(NOW.getTime() - CLEANUP_RETENTION_DAYS * 24 * 60 * 60 * 1000);

describe('AuthCleanupService', () => {
  const prisma = {
    session: { deleteMany: jest.fn() },
    authToken: { deleteMany: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) => Promise.all(operations)),
  };
  const service = new AuthCleanupService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    prisma.session.deleteMany.mockResolvedValue({ count: 2 });
    prisma.authToken.deleteMany.mockResolvedValue({ count: 3 });
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('keeps dead records for the retention period', () => {
    expect(CUTOFF).toEqual(new Date('2026-11-25T03:00:00.000Z'));
  });

  it('deletes sessions that expired or were revoked before the cutoff', async () => {
    await service.removeDeadRecords();

    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ expiresAt: { lt: CUTOFF } }, { revokedAt: { lt: CUTOFF } }] },
    });
  });

  it('deletes auth tokens that expired or were used before the cutoff', async () => {
    await service.removeDeadRecords();

    expect(prisma.authToken.deleteMany).toHaveBeenCalledWith({
      where: { OR: [{ expiresAt: { lt: CUTOFF } }, { usedAt: { lt: CUTOFF } }] },
    });
  });

  it('runs both deletions in one transaction and reports the counts', async () => {
    const logged = jest.spyOn(Logger.prototype, 'log').mockImplementation();

    await expect(service.removeDeadRecords()).resolves.toEqual({ sessions: 2, authTokens: 3 });
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(logged).toHaveBeenCalledWith('Removed 2 dead sessions and 3 dead auth tokens');
  });
});
