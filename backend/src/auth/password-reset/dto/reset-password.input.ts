import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@/auth/dto/credentials.input';
import { ResetLinkMessage } from '../password-reset.messages';

const RESET_TOKEN_PATTERN = /^[\w-]{43}$/;

@InputType()
export class ResetPasswordInput {
  @Field()
  @IsString({ message: ResetLinkMessage.invalid })
  @Matches(RESET_TOKEN_PATTERN, { message: ResetLinkMessage.invalid })
  token!: string;

  @Field()
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: 'Password must be at least 6 characters long' })
  @MaxLength(PASSWORD_MAX_LENGTH, { message: 'Password must not exceed 128 characters' })
  newPassword!: string;
}
