import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '@/prisma/prisma.service';
import { DAY_MS } from '@/common/time';

// Dead records are kept for a day: the resend cooldown and the verification error messages
// read the latest token even after it has expired or been used
export const CLEANUP_RETENTION_DAYS = 1;

export interface CleanupResult {
  sessions: number;
  authTokens: number;
}

@Injectable()
export class AuthCleanupService {
  private readonly logger = new Logger(AuthCleanupService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async removeDeadRecords(): Promise<CleanupResult> {
    const cutoff = new Date(Date.now() - CLEANUP_RETENTION_DAYS * DAY_MS);

    const [sessions, authTokens] = await this.prisma.$transaction([
      this.prisma.session.deleteMany({
        where: { OR: [{ expiresAt: { lt: cutoff } }, { revokedAt: { lt: cutoff } }] },
      }),
      this.prisma.authToken.deleteMany({
        where: { OR: [{ expiresAt: { lt: cutoff } }, { usedAt: { lt: cutoff } }] },
      }),
    ]);

    this.logger.log(
      `Removed ${sessions.count} dead sessions and ${authTokens.count} dead auth tokens`,
    );
    return { sessions: sessions.count, authTokens: authTokens.count };
  }
}
