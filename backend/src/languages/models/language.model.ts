import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Language as LanguageEntity } from '@/generated/prisma/client';

@ObjectType()
export class Language implements Pick<LanguageEntity, 'id' | 'name' | 'iso' | 'nativeName'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  iso!: string;

  @Field()
  nativeName!: string;
}
