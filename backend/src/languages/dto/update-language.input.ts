import { Field, ID, InputType } from '@nestjs/graphql';
import { CreateLanguageInput } from '@/languages/dto/create-language.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateLanguageInput extends CreateLanguageInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
