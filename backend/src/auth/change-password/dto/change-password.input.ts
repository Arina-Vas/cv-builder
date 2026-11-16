import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORDS_DO_NOT_MATCH_MESSAGE,
} from '@/auth/dto/credentials.input';
import { MatchesField } from '@/common/validation/matches-field.decorator';

const PASSWORD_TOO_LONG_MESSAGE = 'Password must not exceed 128 characters';

@InputType()
export class ChangePasswordInput {
  @Field()
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_TOO_LONG_MESSAGE })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  currentPassword!: string;

  @Field()
  @MaxLength(PASSWORD_MAX_LENGTH, { message: PASSWORD_TOO_LONG_MESSAGE })
  @MinLength(PASSWORD_MIN_LENGTH, { message: 'Password must be at least 6 characters long' })
  @IsString()
  @IsNotEmpty({ message: 'New password is required' })
  newPassword!: string;

  @Field()
  @MatchesField<ChangePasswordInput>('newPassword', { message: PASSWORDS_DO_NOT_MATCH_MESSAGE })
  @IsString()
  @IsNotEmpty({ message: 'Confirm password is required' })
  confirmPassword!: string;
}
