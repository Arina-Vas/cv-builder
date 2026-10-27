import type { SkillCategory as SkillCategoryEntity } from '@/generated/prisma/client';
import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class SkillCategory implements Pick<SkillCategoryEntity, 'type' | 'name' | 'id'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  type!: string;
}
