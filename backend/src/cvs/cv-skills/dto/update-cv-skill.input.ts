import { Field, ID, InputType } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { Mastery } from '@/common/graphql/enums';

@InputType()
export class UpdateCvSkillInput {
  @Field(() => ID, { description: 'CvSkill id; its CV is checked against the current user' })
  @IsUUID()
  id!: string;

  @Field(() => Mastery)
  @IsEnum(Mastery, { message: 'Skill mastery is required' })
  mastery!: Mastery;
}
