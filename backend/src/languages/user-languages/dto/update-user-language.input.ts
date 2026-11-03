import { Field, ID, InputType, PickType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateUserLanguageInput } from '@/languages/user-languages/dto/create-user-language.input';

@InputType()
export class UpdateUserLanguageInput extends PickType(CreateUserLanguageInput, [
  'userId',
  'proficiency',
] as const) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
