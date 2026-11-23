import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Skill } from '@/skills/models/skill.model';
import { Mastery } from '@/common/graphql/enums';
import type { CvSkill as CvSkillEntity } from '@/generated/prisma/client';

@ObjectType({ description: "Skill added to a CV; mastery is the CV owner's level of that skill" })
export class CvSkill implements Pick<CvSkillEntity, 'id'> {
  @Field(() => ID)
  id!: string;

  @Field(() => Skill)
  skill!: Skill;

  @Field(() => Mastery)
  mastery!: Mastery;
}
