import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Skill } from '@/skills/models/skill.model';
import { Mastery } from '@/common/graphql/enums';
import type { CvSkill as CvSkillEntity } from '@/generated/prisma/client';

@ObjectType({
  description: "Skill added to a CV; mastery belongs to this CV and starts from the owner's level",
})
export class CvSkill implements Pick<CvSkillEntity, 'id' | 'mastery'> {
  @Field(() => ID)
  id!: string;

  @Field(() => Skill)
  skill!: Skill;

  @Field(() => Mastery)
  mastery!: Mastery;
}
