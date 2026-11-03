import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Proficiency } from '@/common/graphql/enums';
import type { UserLanguage as UserLanguageEntity } from '@/generated/prisma/client';
import { Language } from '@/languages/models/language.model';

@ObjectType()
export class UserLanguage implements Pick<UserLanguageEntity, 'id' | 'proficiency'> {
  @Field(() => ID)
  id!: string;

  @Field(() => Language)
  language!: Language;

  @Field(() => Proficiency)
  proficiency!: Proficiency;
}
