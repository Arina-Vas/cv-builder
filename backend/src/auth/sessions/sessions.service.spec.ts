import { ConfigService } from '@nestjs/config';
import { hashToken } from '@/common/crypto/tokens';
import type { EnvironmentVariables } from '@/config/env.validation';
import { PrismaService } from '@/prisma/prisma.service';
import { REFRESH_GRACE_SECONDS, SessionsService } from './sessions.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const NOW = new Date('2026-10-27T12:00:00.000Z');
const IN_ONE_DAY = new Date('2026-10-28T12:00:00.000Z');

describe('SessionsService', () => {
  const prisma = {
    session: { create: jest.fn(), findUnique: jest.fn(), updateMany: jest.fn() },
  };
  const config = { get: jest.fn().mockReturnValue(1) };
  const service = new SessionsService(
    prisma as unknown as PrismaService,
    config as unknown as ConfigService<EnvironmentVariables, true>,
  );

  const session = (overrides: Partial<{ expiresAt: Date; revokedAt: Date | null }> = {}) => ({
    id: 'session-1',
    userId: 'user-1',
    tokenHash: hashToken('old-token'),
    expiresAt: IN_ONE_DAY,
    revokedAt: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(NOW);
    config.get.mockReturnValue(1);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('stores only the hash of a new refresh token and returns the token itself', async () => {
      prisma.session.create.mockResolvedValue({ id: 'session-1' });

      const issued = await service.create('user-1', 'Firefox');

      expect(issued.sessionId).toBe('session-1');
      expect(prisma.session.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          userAgent: 'Firefox',
          tokenHash: hashToken(issued.refreshToken),
          expiresAt: IN_ONE_DAY,
        },
        select: { id: true },
      });
    });
  });

  describe('rotate', () => {
    it('replaces the refresh token and extends the session', async () => {
      jest.setSystemTime(new Date('2026-10-27T18:00:00.000Z'));
      prisma.session.findUnique.mockResolvedValue(session());
      prisma.session.updateMany.mockResolvedValue({ count: 1 });

      const rotated = await service.rotate('old-token');

      expect(rotated).toEqual({
        sessionId: 'session-1',
        userId: 'user-1',
        refreshToken: expect.any(String),
      });
      expect(rotated?.refreshToken).not.toBe('old-token');
      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-1', tokenHash: hashToken('old-token'), revokedAt: null },
        data: {
          tokenHash: hashToken(rotated!.refreshToken),
          previousTokenHash: hashToken('old-token'),
          rotatedAt: new Date('2026-10-27T18:00:00.000Z'),
          expiresAt: new Date('2026-10-28T18:00:00.000Z'),
        },
      });
    });

    it('returns null for an unknown refresh token', async () => {
      prisma.session.findUnique.mockResolvedValue(null);

      await expect(service.rotate('unknown')).resolves.toBeNull();
      expect(prisma.session.updateMany).not.toHaveBeenCalled();
    });

    it.each([
      ['revoked', { revokedAt: new Date('2026-10-27T11:00:00.000Z') }],
      ['expired', { expiresAt: new Date('2026-10-27T11:59:59.000Z') }],
    ])('returns null for a %s session', async (_, overrides) => {
      prisma.session.findUnique.mockResolvedValue(session(overrides));

      await expect(service.rotate('old-token')).resolves.toBeNull();
      expect(prisma.session.updateMany).not.toHaveBeenCalled();
    });

    it('returns null when a parallel request already rotated the token', async () => {
      prisma.session.findUnique.mockResolvedValue(session());
      prisma.session.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.rotate('old-token')).resolves.toBeNull();
    });
  });

  describe('wasJustRotated', () => {
    const rotatedSession = (
      overrides: Partial<{ revokedAt: Date | null; rotatedAt: Date | null }>,
    ) => ({
      expiresAt: IN_ONE_DAY,
      revokedAt: null,
      rotatedAt: new Date(NOW.getTime() - (REFRESH_GRACE_SECONDS - 1) * 1000),
      ...overrides,
    });

    it('is true for the replaced token of an active session within the grace period', async () => {
      prisma.session.findUnique.mockResolvedValue(rotatedSession({}));

      await expect(service.wasJustRotated('old-token')).resolves.toBe(true);
      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { previousTokenHash: hashToken('old-token') },
        select: { expiresAt: true, revokedAt: true, rotatedAt: true },
      });
    });

    it.each([
      ['unknown token', null],
      [
        'grace period is over',
        rotatedSession({ rotatedAt: new Date(NOW.getTime() - REFRESH_GRACE_SECONDS * 1000) }),
      ],
      ['revoked session', rotatedSession({ revokedAt: NOW })],
      ['never rotated', rotatedSession({ rotatedAt: null })],
    ])('is false for %s', async (_, row) => {
      prisma.session.findUnique.mockResolvedValue(row);

      await expect(service.wasJustRotated('old-token')).resolves.toBe(false);
    });
  });

  describe('findActive', () => {
    it('returns the session id and user id of an active session', async () => {
      prisma.session.findUnique.mockResolvedValue(session());

      await expect(service.findActive('session-1')).resolves.toEqual({
        id: 'session-1',
        userId: 'user-1',
      });
    });

    it.each([
      ['missing', null],
      ['revoked', session({ revokedAt: NOW })],
      ['expired', session({ expiresAt: NOW })],
    ])('returns null for a %s session', async (_, row) => {
      prisma.session.findUnique.mockResolvedValue(row);

      await expect(service.findActive('session-1')).resolves.toBeNull();
    });
  });

  describe('revoke', () => {
    it('revokes one session that is not revoked yet', async () => {
      await service.revoke('session-1');

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { id: 'session-1', revokedAt: null },
        data: { revokedAt: NOW },
      });
    });

    it('revokes the session of a refresh token', async () => {
      await service.revokeByRefreshToken('old-token');

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { tokenHash: hashToken('old-token'), revokedAt: null },
        data: { revokedAt: NOW },
      });
    });

    it('revokes every active session of a user', async () => {
      await service.revokeAllForUser('user-1');

      expect(prisma.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-1', revokedAt: null },
        data: { revokedAt: NOW },
      });
    });
  });
});
