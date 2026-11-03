import { Field, ID, InputType } from '@nestjs/graphql';
import { Proficiency } from '@/common/graphql/enums';
import { IsEnum, IsUUID } from 'class-validator';

@InputType()
export class CreateUserLanguageInput {
  @Field(() => ID)
  @IsUUID('all', { message: 'User is required' })
  userId!: string;

  @Field(() => ID)
  @IsUUID('all', { message: 'Language is required' })
  languageId!: string;

  @Field(() => Proficiency)
  @IsEnum(Proficiency, { message: 'Language proficiency is required' })
  proficiency!: Proficiency;
}
