import { Field, ID, InputType } from '@nestjs/graphql';
import { CreateSkillInput } from '@/skills/dto/create-skill.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateSkillInput extends CreateSkillInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
