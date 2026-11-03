import { Field, ID, InputType, PickType } from '@nestjs/graphql';
import { CreateUserSkillInput } from '@/skills/user-skills/dto/create-user-skill.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateUserSkillInput extends PickType(CreateUserSkillInput, [
  'userId',
  'mastery',
] as const) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
