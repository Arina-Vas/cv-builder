import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { hashPassword } from '@/common/crypto/password';
import { generateToken, hashToken } from '@/common/crypto/tokens';
import { badUserInput } from '@/common/errors/app-errors';
import type { EnvironmentVariables } from '@/config/env.validation';
import { AuthTokenType } from '@/generated/prisma/enums';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import { UsersService } from '@/users/users.service';
import { ResetLinkMessage } from './password-reset.messages';

export const RESET_TOKEN_TTL_MINUTES = 30;
export const REQUEST_COOLDOWN_SECONDS = 60;
export const RESET_PASSWORD_PATH = '/reset-password';

const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

const linkError = (message: string) => badUserInput([{ field: 'token', message }], message);

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly mail: MailService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  async request(email: string): Promise<void> {
    const user = await this.users.findByEmail(email);
    if (!user || (await this.isCoolingDown(user.id))) {
      return;
    }

    const token = generateToken();
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { expiresAt: now },
      }),
      this.prisma.authToken.create({
        data: {
          userId: user.id,
          type: AuthTokenType.PASSWORD_RESET,
          codeHash: hashToken(token),
          expiresAt: new Date(now.getTime() + RESET_TOKEN_TTL_MINUTES * MINUTE_MS),
        },
      }),
    ]);

    void this.mail
      .sendPasswordReset(user.email, this.resetLink(token), RESET_TOKEN_TTL_MINUTES)
      .catch((error: unknown) => {
        this.logger.warn(`Failed to send password reset email to user ${user.id}`, error);
      });
  }

  async reset(token: string, newPassword: string): Promise<void> {
    const found = await this.prisma.authToken.findFirst({
      where: { type: AuthTokenType.PASSWORD_RESET, codeHash: hashToken(token) },
      select: { id: true, userId: true, expiresAt: true, usedAt: true },
    });

    if (!found || found.usedAt) {
      throw linkError(ResetLinkMessage.invalid);
    }
    if (found.expiresAt <= new Date()) {
      throw linkError(ResetLinkMessage.expired);
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      const { count } = await tx.authToken.updateMany({
        where: { id: found.id, usedAt: null },
        data: { usedAt: now },
      });
      if (count === 0) {
        throw linkError(ResetLinkMessage.invalid);
      }
      await tx.user.update({ where: { id: found.userId }, data: { passwordHash } });
      await tx.session.updateMany({
        where: { userId: found.userId, revokedAt: null },
        data: { revokedAt: now },
      });
    });
  }

  private async isCoolingDown(userId: string): Promise<boolean> {
    const latest = await this.prisma.authToken.findFirst({
      where: { userId, type: AuthTokenType.PASSWORD_RESET },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    return (
      latest !== null &&
      latest.createdAt.getTime() + REQUEST_COOLDOWN_SECONDS * SECOND_MS > Date.now()
    );
  }

  private resetLink(token: string): string {
    const url = new URL(RESET_PASSWORD_PATH, this.config.get('FRONTEND_URL', { infer: true }));
    url.searchParams.set('token', token);
    return url.toString();
  }
}
