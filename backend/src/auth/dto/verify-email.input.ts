import { Field, InputType } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

@InputType()
export class VerifyEmailInput {
  @Field()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'Verification code is required' })
  @Matches(/^\d{6}$/, { message: 'Please enter a valid 6-digit code' })
  code!: string;
}
