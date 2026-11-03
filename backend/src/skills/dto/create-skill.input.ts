import { Field, ID, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';
import { NormalizeText } from '@/common/validation/transforms';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';

@InputType()
export class CreateSkillInput {
  @Field()
  @IsNotEmpty({ message: 'Skill is required' })
  @IsString()
  @NormalizeText()
  @MaxLength(MAX_NAME_LENGTH, {
    message: `Skill name must not exceed ${MAX_NAME_LENGTH} characters`,
  })
  name!: string;

  @Field(() => ID)
  @IsUUID('all', { message: 'Category is required' })
  categoryId!: string;
}
