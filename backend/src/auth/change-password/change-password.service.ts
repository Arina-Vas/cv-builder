import { Injectable } from '@nestjs/common';
import { hashPassword, verifyPassword } from '@/common/crypto/password';
import { badUserInput, unauthenticated } from '@/common/errors/app-errors';
import { PrismaService } from '@/prisma/prisma.service';

export const CURRENT_PASSWORD_INCORRECT_MESSAGE = 'Current password is incorrect';
export const SAME_PASSWORD_MESSAGE = 'New password must be different from the current password';

const fieldError = (field: string, message: string) => badUserInput([{ field, message }], message);

@Injectable()
export class ChangePasswordService {
  constructor(private readonly prisma: PrismaService) {}

  async change(
    userId: string,
    sessionId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true },
    });
    if (!user) {
      throw unauthenticated();
    }

    if (!(await verifyPassword(user.passwordHash, currentPassword))) {
      throw fieldError('currentPassword', CURRENT_PASSWORD_INCORRECT_MESSAGE);
    }
    if (newPassword === currentPassword) {
      throw fieldError('newPassword', SAME_PASSWORD_MESSAGE);
    }

    const passwordHash = await hashPassword(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({ where: { id: userId }, data: { passwordHash } }),
      this.prisma.session.updateMany({
        where: { userId, revokedAt: null, id: { not: sessionId } },
        data: { revokedAt: new Date() },
      }),
    ]);
  }
}
