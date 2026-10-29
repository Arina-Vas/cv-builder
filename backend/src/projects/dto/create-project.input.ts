import { Field, ID, InputType } from '@nestjs/graphql';
import {
  ArrayUnique,
  IsArray,
  IsDate,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { NormalizeText, TrimText } from '@/common/validation/transforms';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { DateScalar } from '@/common/graphql/date.scalar';
import { IsNotBeforeDate } from '@/common/validation/is-not-before-date';

@InputType()
export class CreateProjectInput {
  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'Project name is required' })
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Project name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  name!: string;

  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'Domain is required' })
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Domain must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  domain!: string;

  @Field()
  @IsString()
  @TrimText()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(MAX_DESCRIPTION_LENGTH, {
    message: `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  })
  description!: string;

  @Field(() => DateScalar)
  @IsDate()
  startDate!: Date;

  @Field(() => DateScalar)
  @IsDate()
  @IsNotBeforeDate('startDate', { message: 'End date cannot be earlier than start date' })
  endDate!: Date;

  @Field(() => [ID], { defaultValue: [] })
  @IsArray()
  @ArrayUnique({ message: 'Technologies must not repeat' })
  @IsUUID('all', { each: true })
  technologyIds: string[] = [];
}
