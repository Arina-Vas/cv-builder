import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Skill } from '@/skills/models/skill.model';
import { Mastery } from '@/common/graphql/enums';
import type { UserSkill as UserSkillEntity } from '@/generated/prisma/client';

@ObjectType()
export class UserSkill implements Pick<UserSkillEntity, 'id' | 'mastery'> {
  @Field(() => ID)
  id!: string;

  @Field(() => Skill)
  skill!: Skill;

  @Field(() => Mastery)
  mastery!: Mastery;
}
