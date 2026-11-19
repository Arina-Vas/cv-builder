import { Field, ID, InputType } from '@nestjs/graphql';
import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsDate,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MAX_DESCRIPTION_LENGTH } from '@/common/graphql/constants';
import { DateScalar } from '@/common/graphql/date.scalar';
import { IsNotBeforeDate } from '@/common/validation/is-not-before-date';
import { TrimText } from '@/common/validation/transforms';

@InputType()
export class CreateCvProjectInput {
  @Field(() => ID, {
    description:
      'CV the project is added to; checked against the current user. ' +
      'In updateCvProject it is the current CV and never changes',
  })
  @IsUUID('all', { message: 'CV is required' })
  cvId!: string;

  @Field(() => ID, { description: 'Project from the catalog; cannot be changed later' })
  @IsUUID('all', { message: 'Project is required' })
  projectId!: string;

  @Field(() => DateScalar, { description: "Must be within the project's start and end dates" })
  @IsDate({ message: 'Start date is required' })
  startDate!: Date;

  @Field(() => DateScalar, {
    nullable: true,
    description:
      'null means "Till now"; otherwise not before startDate and not after the project end',
  })
  @IsOptional()
  @IsDate()
  @IsNotBeforeDate('startDate', { message: 'End date cannot be earlier than start date' })
  endDate?: Date | null;

  @Field(() => [ID], {
    description: 'At least one project role; the set replaces the old one on update',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'At least one role must be selected' })
  @ArrayUnique({ message: 'Roles must not repeat' })
  @IsUUID('all', { each: true })
  roleIds!: string[];

  @Field(() => String, {
    nullable: true,
    description: 'Free text, one responsibility per line (the UI shows each line as a chip)',
  })
  @IsOptional()
  @IsString()
  @TrimText()
  @MaxLength(MAX_DESCRIPTION_LENGTH, {
    message: `Responsibilities must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  })
  responsibilities?: string | null;
}
