import { ArgsType, Field, ID } from '@nestjs/graphql';
import { ArrayNotEmpty, ArrayUnique, IsUUID } from 'class-validator';

@ArgsType()
export class DeleteUserLanguagesArgs {
  @Field(() => ID)
  @IsUUID()
  userId!: string;

  @Field(() => [ID])
  @IsUUID('all', { each: true })
  @ArrayUnique()
  @ArrayNotEmpty()
  ids!: string[];
}
