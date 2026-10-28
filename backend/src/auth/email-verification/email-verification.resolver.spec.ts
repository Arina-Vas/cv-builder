import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { User } from '@/users/models/user.model';
import { VerifyEmailInput } from './dto/verify-email.input';
import { EmailVerificationResolver } from './email-verification.resolver';
import type { EmailVerificationService } from './email-verification.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

describe('EmailVerificationResolver', () => {
  const user = { id: 'user-1' } as User;
  const verification = { verify: jest.fn(), resend: jest.fn() };
  const resolver = new EmailVerificationResolver(
    verification as unknown as EmailVerificationService,
  );

  it('verifies the code of the current user', async () => {
    const verified = { ...user, emailVerifiedAt: new Date() } as User;
    verification.verify.mockResolvedValue(verified);

    await expect(resolver.verifyEmail({ code: '042917' }, user)).resolves.toBe(verified);
    expect(verification.verify).toHaveBeenCalledWith(user, '042917');
  });

  it('resends the code to the current user', async () => {
    await expect(resolver.resendVerificationCode(user)).resolves.toBe(true);
    expect(verification.resend).toHaveBeenCalledWith(user);
  });
});

describe('VerifyEmailInput', () => {
  const messagesFor = async (code: unknown) => {
    const [error] = await validate(plainToInstance(VerifyEmailInput, { code }));
    return Object.values(error?.constraints ?? {});
  };

  it('accepts 6 digits and trims spaces around them', async () => {
    const input = plainToInstance(VerifyEmailInput, { code: ' 042917 ' });

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input.code).toBe('042917');
  });

  it('requires the code', async () => {
    await expect(messagesFor('')).resolves.toContain('Verification code is required');
  });

  it.each(['12345', '1234567', '12a456'])('rejects "%s"', async (code) => {
    await expect(messagesFor(code)).resolves.toEqual(['Please enter a valid 6-digit code']);
  });
});
