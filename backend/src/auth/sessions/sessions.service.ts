import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateToken, hashToken } from '@/common/crypto/tokens';
import type { EnvironmentVariables } from '@/config/env.validation';
import { PrismaService } from '@/prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;
export const REFRESH_GRACE_SECONDS = 30;

export interface IssuedSession {
  sessionId: string;
  refreshToken: string;
}

export interface RotatedSession extends IssuedSession {
  userId: string;
}

export interface ActiveSession {
  id: string;
  userId: string;
}

const isActive = (session: { expiresAt: Date; revokedAt: Date | null }): boolean =>
  session.revokedAt === null && session.expiresAt > new Date();

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async create(userId: string, userAgent?: string): Promise<IssuedSession> {
    const refreshToken = generateToken();
    const session = await this.prisma.session.create({
      data: { userId, userAgent, tokenHash: hashToken(refreshToken), expiresAt: this.expiresAt() },
      select: { id: true },
    });

    return { sessionId: session.id, refreshToken };
  }

  async rotate(refreshToken: string): Promise<RotatedSession | null> {
    const tokenHash = hashToken(refreshToken);
    const session = await this.prisma.session.findUnique({ where: { tokenHash } });

    if (!session || !isActive(session)) {
      return null;
    }

    const nextToken = generateToken();
    const { count } = await this.prisma.session.updateMany({
      where: { id: session.id, tokenHash, revokedAt: null },
      data: {
        tokenHash: hashToken(nextToken),
        previousTokenHash: tokenHash,
        rotatedAt: new Date(),
        expiresAt: this.expiresAt(),
      },
    });

    return count === 1
      ? { sessionId: session.id, userId: session.userId, refreshToken: nextToken }
      : null;
  }

  async wasJustRotated(refreshToken: string): Promise<boolean> {
    const session = await this.prisma.session.findUnique({
      where: { previousTokenHash: hashToken(refreshToken) },
      select: { expiresAt: true, revokedAt: true, rotatedAt: true },
    });

    return (
      session !== null &&
      isActive(session) &&
      session.rotatedAt !== null &&
      Date.now() - session.rotatedAt.getTime() < REFRESH_GRACE_SECONDS * 1000
    );
  }

  async findActive(sessionId: string): Promise<ActiveSession | null> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });

    return session && isActive(session) ? { id: session.id, userId: session.userId } : null;
  }

  async revoke(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeByRefreshToken(refreshToken: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { tokenHash: hashToken(refreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private expiresAt(): Date {
    return new Date(Date.now() + this.config.get('REFRESH_TTL_DAYS', { infer: true }) * DAY_MS);
  }
}
