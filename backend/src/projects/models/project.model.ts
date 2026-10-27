import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateScalar } from '@/common/graphql/date.scalar';
import type { Project as ProjectEntity } from '@/generated/prisma/client';
import { Skill } from '@/skills/models/skill.model';

@ObjectType()
export class Project implements Pick<
  ProjectEntity,
  'name' | 'id' | 'domain' | 'description' | 'endDate' | 'startDate'
> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  domain!: string;

  @Field(() => DateScalar)
  startDate!: Date;

  @Field(() => DateScalar)
  endDate!: Date;

  @Field()
  description!: string;

  @Field(() => [Skill], {
    description: 'Technologies used on the project ("Environment" in the UI)',
  })
  technologies!: Skill[];
}
