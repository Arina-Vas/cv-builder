import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Skill as SkillEntity } from '@/generated/prisma/client';
import { SkillCategory } from '@/skills/models/skill-category.model';

@ObjectType()
export class Skill implements Pick<SkillEntity, 'id' | 'name'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field(() => SkillCategory)
  category!: SkillCategory;
}
