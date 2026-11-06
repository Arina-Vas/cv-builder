import { Field, ID, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  EMAIL_MAX_LENGTH,
} from '@/auth/dto/credentials.input';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { NormalizeText } from '@/common/validation/transforms';
import { UserRole } from '@/common/graphql/enums';

@InputType()
export class CreateUserInput {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @MaxLength(EMAIL_MAX_LENGTH, { message: 'Invalid email address' })
  @IsEmail({}, { message: 'Invalid email address' })
  @IsString({ message: 'Invalid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @Field()
  @MaxLength(PASSWORD_MAX_LENGTH, {
    message: `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`,
  })
  @MinLength(PASSWORD_MIN_LENGTH, {
    message: `Password must contain at least ${PASSWORD_MIN_LENGTH} characters`,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;

  @Field()
  @MaxLength(MAX_NAME_LENGTH, {
    message: `First name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  @NormalizeText()
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @Field()
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Last name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  @NormalizeText()
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty({ message: 'Department is required' })
  departmentId!: string;

  @Field(() => ID)
  @IsUUID()
  @IsNotEmpty({ message: 'Position is required' })
  positionId!: string;

  @Field(() => UserRole)
  @IsEnum(UserRole)
  @IsNotEmpty({ message: 'Role is required' })
  role!: UserRole;
}
