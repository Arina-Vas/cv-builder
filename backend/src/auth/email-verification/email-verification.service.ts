import { Injectable } from '@nestjs/common';
import { generateVerificationCode, hashToken, matchesHash } from '@/common/crypto/tokens';
import { badUserInput, conflict, rateLimited } from '@/common/errors/app-errors';
import { AuthTokenType } from '@/generated/prisma/enums';
import { MailService } from '@/mail/mail.service';
import { PrismaService } from '@/prisma/prisma.service';
import type { User } from '@/users/models/user.model';
import { UsersService } from '@/users/users.service';

export const CODE_TTL_MINUTES = 10;
export const RESEND_COOLDOWN_SECONDS = 60;
export const MAX_CODE_ATTEMPTS = 5;

export const VerificationMessage = {
  invalid: 'Invalid verification code',
  expired: 'Verification code has expired',
  used: 'Verification code has already been used',
  alreadyVerified: 'Email is already verified',
  wait: 'Please wait before requesting another code',
} as const;

const MINUTE_MS = 60 * 1000;
const SECOND_MS = 1000;

const codeError = (message: string) => badUserInput([{ field: 'code', message }], message);

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UsersService,
    private readonly mail: MailService,
  ) {}

  async sendCode(userId: string, email: string): Promise<void> {
    const code = generateVerificationCode();
    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.authToken.updateMany({
        where: {
          userId,
          type: AuthTokenType.EMAIL_VERIFICATION,
          usedAt: null,
          expiresAt: { gt: now },
        },
        data: { expiresAt: now },
      }),
      this.prisma.authToken.create({
        data: {
          userId,
          type: AuthTokenType.EMAIL_VERIFICATION,
          codeHash: hashToken(code),
          expiresAt: new Date(now.getTime() + CODE_TTL_MINUTES * MINUTE_MS),
        },
      }),
    ]);

    await this.mail.sendVerificationCode(email, code, CODE_TTL_MINUTES);
  }

  async resend(user: User): Promise<void> {
    if (user.emailVerifiedAt) {
      throw conflict('email', VerificationMessage.alreadyVerified);
    }

    const latest = await this.prisma.authToken.findFirst({
      where: { userId: user.id, type: AuthTokenType.EMAIL_VERIFICATION },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true },
    });
    const waitMs = latest
      ? latest.createdAt.getTime() + RESEND_COOLDOWN_SECONDS * SECOND_MS - Date.now()
      : 0;
    if (waitMs > 0) {
      throw rateLimited(Math.ceil(waitMs / SECOND_MS), VerificationMessage.wait);
    }

    await this.sendCode(user.id, user.email);
  }

  async verify(user: User, code: string): Promise<User> {
    if (user.emailVerifiedAt) {
      throw conflict('email', VerificationMessage.alreadyVerified);
    }

    // Only the newest code counts, so wrong guesses can be counted against it
    const token = await this.prisma.authToken.findFirst({
      where: { userId: user.id, type: AuthTokenType.EMAIL_VERIFICATION },
      orderBy: { createdAt: 'desc' },
      select: { id: true, codeHash: true, expiresAt: true, usedAt: true, attempts: true },
    });

    if (!token) {
      throw codeError(VerificationMessage.invalid);
    }
    if (token.usedAt) {
      throw codeError(VerificationMessage.used);
    }
    if (token.expiresAt <= new Date() || token.attempts >= MAX_CODE_ATTEMPTS) {
      throw codeError(VerificationMessage.expired);
    }
    if (!matchesHash(code, token.codeHash)) {
      await this.prisma.authToken.update({
        where: { id: token.id },
        data: { attempts: { increment: 1 } },
      });
      throw codeError(VerificationMessage.invalid);
    }

    await this.prisma.$transaction(async (tx) => {
      const now = new Date();
      // Re-checked in the update itself: parallel wrong guesses may have used up the attempts
      const { count } = await tx.authToken.updateMany({
        where: {
          id: token.id,
          usedAt: null,
          expiresAt: { gt: now },
          attempts: { lt: MAX_CODE_ATTEMPTS },
        },
        data: { usedAt: now },
      });
      if (count === 0) {
        throw codeError(VerificationMessage.used);
      }
      await tx.user.update({ where: { id: user.id }, data: { emailVerifiedAt: now } });
    });

    const verified = await this.users.findById(user.id);
    if (!verified) {
      throw codeError(VerificationMessage.invalid);
    }
    return verified;
  }
}
