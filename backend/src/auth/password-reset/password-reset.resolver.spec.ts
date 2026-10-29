import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RequestPasswordResetInput } from './dto/request-password-reset.input';
import { ResetPasswordInput } from './dto/reset-password.input';
import { ResetLinkMessage } from './password-reset.messages';
import { PasswordResetResolver } from './password-reset.resolver';
import type { PasswordResetService } from './password-reset.service';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));
jest.mock('@nestjs/config', () => ({ ConfigService: class ConfigService {} }));

const TOKEN = 'Abc_-'.padEnd(43, 'x');

const messagesFor = async <T extends object>(
  type: new () => T,
  plain: Record<string, unknown>,
): Promise<Record<string, string[]>> => {
  const errors = await validate(plainToInstance(type, plain));
  return Object.fromEntries(
    errors.map((error) => [error.property, Object.values(error.constraints ?? {})]),
  );
};

describe('PasswordResetResolver', () => {
  const passwordReset = { request: jest.fn(), reset: jest.fn() };
  const resolver = new PasswordResetResolver(passwordReset as unknown as PasswordResetService);

  it('requests a reset link and always returns true', async () => {
    await expect(
      resolver.requestPasswordReset({ email: 'employee@cv-builder.local' }),
    ).resolves.toBe(true);
    expect(passwordReset.request).toHaveBeenCalledWith('employee@cv-builder.local');
  });

  it('resets the password with the token from the link', async () => {
    await expect(
      resolver.resetPassword({
        token: TOKEN,
        newPassword: 'new-secret',
        confirmPassword: 'new-secret',
      }),
    ).resolves.toBe(true);
    expect(passwordReset.reset).toHaveBeenCalledWith(TOKEN, 'new-secret');
  });
});

describe('RequestPasswordResetInput', () => {
  it('accepts a valid email and trims it', async () => {
    const input = plainToInstance(RequestPasswordResetInput, {
      email: ' employee@cv-builder.local ',
    });

    await expect(validate(input)).resolves.toHaveLength(0);
    expect(input.email).toBe('employee@cv-builder.local');
  });

  it('requires a valid email', async () => {
    await expect(messagesFor(RequestPasswordResetInput, { email: '' })).resolves.toEqual({
      email: expect.arrayContaining(['Email is required']) as unknown,
    });
    await expect(messagesFor(RequestPasswordResetInput, { email: 'nope' })).resolves.toEqual({
      email: ['Please enter a valid email address'],
    });
  });
});

describe('ResetPasswordInput', () => {
  it('accepts a token from the link and a valid password', async () => {
    await expect(
      validate(
        plainToInstance(ResetPasswordInput, {
          token: TOKEN,
          newPassword: 'new-secret',
          confirmPassword: 'new-secret',
        }),
      ),
    ).resolves.toHaveLength(0);
  });

  it.each(['', 'short', `${TOKEN}x`, 'x'.repeat(42) + '!'])(
    'treats a malformed token "%s" as an invalid link',
    async (token) => {
      const messages = await messagesFor(ResetPasswordInput, {
        token,
        newPassword: 'new-secret',
        confirmPassword: 'new-secret',
      });

      expect(messages['token']).toEqual([ResetLinkMessage.invalid]);
    },
  );

  it('requires a new password of 6 to 128 characters', async () => {
    const check = (newPassword: string) =>
      messagesFor(ResetPasswordInput, { token: TOKEN, newPassword, confirmPassword: newPassword });

    await expect(check('')).resolves.toEqual({
      newPassword: expect.arrayContaining(['New password is required']) as unknown,
      confirmPassword: expect.arrayContaining(['Confirm Password is required']) as unknown,
    });
    await expect(check('12345')).resolves.toEqual({
      newPassword: ['Password must be at least 6 characters long'],
    });
    await expect(check('x'.repeat(129))).resolves.toEqual({
      newPassword: ['Password must not exceed 128 characters'],
    });
  });

  it('requires a confirmation equal to the new password', async () => {
    const check = (confirmPassword?: string) =>
      messagesFor(ResetPasswordInput, { token: TOKEN, newPassword: 'new-secret', confirmPassword });

    await expect(check()).resolves.toEqual({
      confirmPassword: expect.arrayContaining(['Confirm Password is required']) as unknown,
    });
    await expect(check('new-secreT')).resolves.toEqual({
      confirmPassword: ['Passwords do not match'],
    });
  });
});
