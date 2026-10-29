import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { VALIDATOR_OPTIONS } from '@/common/validation/validator-options';
import { SignInInput, SignUpInput } from './credentials.input';

const messagesFor = async (
  type: typeof SignInInput | typeof SignUpInput,
  plain: Record<string, unknown>,
): Promise<Record<string, string[]>> => {
  const errors = await validate(plainToInstance(type, plain), VALIDATOR_OPTIONS);
  return Object.fromEntries(
    errors.map((error) => [error.property, Object.values(error.constraints ?? {})]),
  );
};

describe.each([SignInInput, SignUpInput])('%p', (type) => {
  it('accepts valid credentials and trims the email', async () => {
    const instance = plainToInstance(type, {
      email: '  employee@cv-builder.local ',
      password: 'secret123',
      confirmPassword: 'secret123',
    });

    await expect(validate(instance)).resolves.toHaveLength(0);
    expect(instance.email).toBe('employee@cv-builder.local');
  });

  it('gives only the "required" message for empty fields', async () => {
    const messages = await messagesFor(type, { email: '', password: '', confirmPassword: '' });

    expect(messages['email']).toEqual(['Email is required']);
    expect(messages['password']).toEqual(['Password is required']);
  });

  it('gives only the "required" message for an email of spaces', async () => {
    const messages = await messagesFor(type, { email: '   ', password: 'secret123' });

    expect(messages['email']).toEqual(['Email is required']);
  });

  it('rejects a non-string email without trying to trim it', async () => {
    const messages = await messagesFor(type, { email: 42, password: 'secret123' });

    expect(messages['email']).toEqual(['Please enter a valid email address']);
  });

  it('rejects an invalid email', async () => {
    const messages = await messagesFor(type, { email: 'em ployee@x', password: 'secret123' });

    expect(messages['email']).toEqual(['Please enter a valid email address']);
  });

  it('rejects a password shorter than 6 characters', async () => {
    const messages = await messagesFor(type, { email: 'a@b.co', password: '12345' });

    expect(messages['password']).toEqual(['Password must be at least 6 characters long']);
  });

  it('rejects a password longer than 128 characters', async () => {
    const messages = await messagesFor(type, { email: 'a@b.co', password: 'x'.repeat(129) });

    expect(messages['password']).toEqual(['Password must not exceed 128 characters']);
  });
});

describe('SignUpInput confirmPassword', () => {
  it('is required', async () => {
    const messages = await messagesFor(SignUpInput, {
      email: 'a@b.co',
      password: 'secret123',
      confirmPassword: '',
    });

    expect(messages['confirmPassword']).toEqual(['Confirm Password is required']);
  });

  it('must match the password', async () => {
    const messages = await messagesFor(SignUpInput, {
      email: 'a@b.co',
      password: 'secret123',
      confirmPassword: 'secret124',
    });

    expect(messages['confirmPassword']).toEqual(['Passwords do not match']);
  });

  it('is not part of SignInInput', async () => {
    await expect(
      validate(plainToInstance(SignInInput, { email: 'a@b.co', password: 'secret123' })),
    ).resolves.toHaveLength(0);
  });
});
