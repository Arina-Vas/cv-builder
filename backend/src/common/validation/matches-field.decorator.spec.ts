import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { MatchesField } from './matches-field.decorator';

class WithMessage {
  password!: string;

  @MatchesField<WithMessage>('password', { message: 'Passwords do not match' })
  confirmPassword!: string;
}

class WithDefaultMessage {
  password!: string;

  @MatchesField<WithDefaultMessage>('password')
  confirmPassword!: string;
}

const constraintsOf = async (type: new () => object, plain: Record<string, unknown>) => {
  const [error] = await validate(plainToInstance(type, plain));
  return error?.constraints;
};

describe('MatchesField', () => {
  it('accepts a value equal to the other field', async () => {
    await expect(
      constraintsOf(WithMessage, { password: 'secret123', confirmPassword: 'secret123' }),
    ).resolves.toBeUndefined();
  });

  it.each([
    ['a different value', 'secret124'],
    ['a different letter case', 'SECRET123'],
    ['a missing value', undefined],
  ])('rejects %s', async (_, confirmPassword) => {
    await expect(
      constraintsOf(WithMessage, { password: 'secret123', confirmPassword }),
    ).resolves.toEqual({ matchesField: 'Passwords do not match' });
  });

  it('has a default message', async () => {
    await expect(
      constraintsOf(WithDefaultMessage, { password: 'secret123', confirmPassword: 'other' }),
    ).resolves.toEqual({ matchesField: 'confirmPassword must match password' });
  });
});
