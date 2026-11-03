import { Field, ID, InputType } from '@nestjs/graphql';
import { Mastery } from '@/common/graphql/enums';
import { IsEnum, IsUUID } from 'class-validator';

@InputType()
export class CreateUserSkillInput {
  @Field(() => ID)
  @IsUUID('all', { message: 'User is required' })
  userId!: string;

  @Field(() => ID)
  @IsUUID('all', { message: 'Skill is required' })
  skillId!: string;

  @Field(() => Mastery)
  @IsEnum(Mastery, { message: 'Skill mastery is required' })
  mastery!: Mastery;
}
