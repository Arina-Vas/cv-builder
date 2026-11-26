import { ArgsType, Field, ID } from '@nestjs/graphql';
import { ArrayNotEmpty, ArrayUnique, IsUUID } from 'class-validator';

@ArgsType()
export class DeleteCvSkillsArgs {
  @Field(() => ID)
  @IsUUID()
  cvId!: string;

  @Field(() => [ID])
  @IsUUID('all', { each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  ids!: string[];
}
