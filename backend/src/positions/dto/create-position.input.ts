import { InputType, Field } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { NormalizeText } from '@/common/validation/transforms';

@InputType()
export class CreatePositionInput {
  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'Position name is required' })
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Position name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  name!: string;
}
