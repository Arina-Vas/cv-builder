import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import {
  CONFIRM_PASSWORD_REQUIRED_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORDS_DO_NOT_MATCH_MESSAGE,
} from '@/auth/dto/credentials.input';
import { MatchesField } from '@/common/validation/matches-field.decorator';
import { ResetLinkMessage } from '../password-reset.messages';

const RESET_TOKEN_PATTERN = /^[\w-]{43}$/;

@InputType()
export class ResetPasswordInput {
  @Field()
  @Matches(RESET_TOKEN_PATTERN, { message: ResetLinkMessage.invalid })
  @IsString({ message: ResetLinkMessage.invalid })
  token!: string;

  @Field()
  @MaxLength(PASSWORD_MAX_LENGTH, { message: 'Password must not exceed 128 characters' })
  @MinLength(PASSWORD_MIN_LENGTH, { message: 'Password must be at least 6 characters long' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  newPassword!: string;

  @Field()
  @MatchesField<ResetPasswordInput>('newPassword', { message: PASSWORDS_DO_NOT_MATCH_MESSAGE })
  @IsString()
  @IsNotEmpty({ message: CONFIRM_PASSWORD_REQUIRED_MESSAGE })
  confirmPassword!: string;
}
