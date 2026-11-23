import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';

@InputType()
export class CreateCvSkillInput {
  @Field(() => ID, {
    description:
      'CV the skill is added to; checked against the current user. ' +
      "The skill must be one of the CV owner's skills",
  })
  @IsUUID('all', { message: 'CV is required' })
  cvId!: string;

  @Field(() => ID)
  @IsUUID('all', { message: 'Skill is required' })
  skillId!: string;
}
