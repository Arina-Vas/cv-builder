import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Skill } from '@/skills/models/skill.model';

@ObjectType({
  description:
    'A CV skill in the Professional skills table, with experience counted from the CV projects',
})
export class CvPreviewSkill {
  @Field(() => Skill)
  skill!: Skill;

  @Field(() => Int, {
    nullable: true,
    description:
      'Full years since the CV-specific start date of the earliest CV project whose environment ' +
      'contains the skill; 0 under a year; null if no CV project uses it',
  })
  experienceYears!: number | null;

  @Field(() => Int, {
    nullable: true,
    description:
      'End year of the latest CV project whose environment contains the skill; a project without ' +
      'an end date ("Till now") counts as the current year; null if no CV project uses it',
  })
  lastUsedYear!: number | null;
}
