import { ArgsType, Field, ID } from '@nestjs/graphql';
import { ArrayNotEmpty, ArrayUnique, IsUUID } from 'class-validator';

@ArgsType()
export class DeleteUserSkillsArgs {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field(() => [ID])
  @IsUUID('all', { each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  ids!: string[];
}
