import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VALIDATOR_OPTIONS } from '@/common/validation/validator-options';
import type { User } from '@/users/models/user.model';
import { ChangePasswordResolver } from './change-password.resolver';
import type { ChangePasswordService } from './change-password.service';
import { ChangePasswordInput } from './dto/change-password.input';

jest.mock('@/prisma/prisma.service', () => ({ PrismaService: class PrismaService {} }));

const messagesFor = async (plain: Record<string, unknown>): Promise<Record<string, string[]>> => {
  const errors = await validate(plainToInstance(ChangePasswordInput, plain), VALIDATOR_OPTIONS);
  return Object.fromEntries(
    errors.map((error) => [error.property, Object.values(error.constraints ?? {})]),
  );
};

describe('ChangePasswordResolver', () => {
  const passwordChange = { change: jest.fn() };
  const resolver = new ChangePasswordResolver(passwordChange as unknown as ChangePasswordService);

  it('changes the password of the user from the auth context, keeping the current session', async () => {
    await expect(
      resolver.changePassword(
        { currentPassword: 'old-secret', newPassword: 'new-secret', confirmPassword: 'new-secret' },
        { id: 'user-1' } as User,
        'session-1',
      ),
    ).resolves.toBe(true);
    expect(passwordChange.change).toHaveBeenCalledWith(
      'user-1',
      'session-1',
      'old-secret',
      'new-secret',
    );
  });
});

describe('ChangePasswordInput', () => {
  const valid = {
    currentPassword: 'old',
    newPassword: 'new-secret',
    confirmPassword: 'new-secret',
  };

  it('accepts any non-empty current password and a valid new one', async () => {
    await expect(messagesFor(valid)).resolves.toEqual({});
  });

  it('requires every field with the Settings page messages', async () => {
    await expect(messagesFor({})).resolves.toEqual({
      currentPassword: ['Password is required'],
      newPassword: ['New password is required'],
      confirmPassword: ['Confirm password is required'],
    });
  });

  it('caps the current password at 128 characters', async () => {
    await expect(messagesFor({ ...valid, currentPassword: 'x'.repeat(129) })).resolves.toEqual({
      currentPassword: ['Password must not exceed 128 characters'],
    });
  });

  it('requires a new password of 6 to 128 characters', async () => {
    const check = (newPassword: string) =>
      messagesFor({ ...valid, newPassword, confirmPassword: newPassword });

    await expect(check('12345')).resolves.toEqual({
      newPassword: ['Password must be at least 6 characters long'],
    });
    await expect(check('x'.repeat(129))).resolves.toEqual({
      newPassword: ['Password must not exceed 128 characters'],
    });
  });

  it('requires a confirmation equal to the new password', async () => {
    await expect(messagesFor({ ...valid, confirmPassword: 'new-secreT' })).resolves.toEqual({
      confirmPassword: ['Passwords do not match'],
    });
  });
});
