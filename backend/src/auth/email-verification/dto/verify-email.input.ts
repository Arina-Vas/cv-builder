import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Matches(/^\d{6}$/, { message: 'Please enter a valid 6-digit code' })
  @IsString({ message: 'Please enter a valid 6-digit code' })
  @IsNotEmpty({ message: 'Verification code is required' })
  code!: string;
}
