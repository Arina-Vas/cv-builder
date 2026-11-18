import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { MAX_CV_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/common/graphql/constants';
import { NormalizeText, TrimText } from '@/common/validation/transforms';

@InputType()
export class CreateCvInput {
  @Field(() => ID, {
    description:
      'CV owner. An Employee may pass only their own id. In updateCv it is checked against ' +
      'the current owner and never changes it',
  })
  @IsUUID('all', { message: 'User is required' })
  userId!: string;

  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'CV name is required' })
  @MaxLength(MAX_CV_NAME_LENGTH, {
    message: `CV name must not exceed ${MAX_CV_NAME_LENGTH} characters`,
  })
  name!: string;

  @Field()
  @IsString()
  @NormalizeText()
  @IsNotEmpty({ message: 'Education is required' })
  @MaxLength(MAX_CV_NAME_LENGTH, {
    message: `Education must not exceed ${MAX_CV_NAME_LENGTH} characters`,
  })
  education!: string;

  @Field()
  @IsString()
  @TrimText()
  @IsNotEmpty({ message: 'Description is required' })
  @MaxLength(MAX_DESCRIPTION_LENGTH, {
    message: `CV description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`,
  })
  description!: string;
}
