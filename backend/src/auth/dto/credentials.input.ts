import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { MatchesField } from '@/common/validation/matches-field.decorator';

export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const CONFIRM_PASSWORD_REQUIRED_MESSAGE = 'Confirm Password is required';
export const PASSWORDS_DO_NOT_MATCH_MESSAGE = 'Passwords do not match';
const EMAIL_MAX_LENGTH = 254;

@InputType({ isAbstract: true })
abstract class CredentialsInput {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(EMAIL_MAX_LENGTH, { message: 'Please enter a valid email address' })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsString({ message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @Field()
  @MaxLength(PASSWORD_MAX_LENGTH, { message: 'Password must not exceed 128 characters' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: 'Password must be at least 6 characters long' })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}

@InputType()
export class SignInInput extends CredentialsInput {}

@InputType()
export class SignUpInput extends CredentialsInput {
  @Field()
  @MatchesField<SignUpInput>('password', { message: PASSWORDS_DO_NOT_MATCH_MESSAGE })
  @IsString()
  @IsNotEmpty({ message: CONFIRM_PASSWORD_REQUIRED_MESSAGE })
  confirmPassword!: string;
}
