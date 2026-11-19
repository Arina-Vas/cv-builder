import { Field, ID, ObjectType } from '@nestjs/graphql';
import { DateScalar } from '@/common/graphql/date.scalar';
import type { CvProject as CvProjectEntity } from '@/generated/prisma/client';
import { Project } from '@/projects/models/project.model';
import { ProjectRole } from '@/projects/models/project-role.model';

@ObjectType({
  description:
    'A catalog project added to a CV, with CV-specific dates, roles and responsibilities',
})
export class CvProject implements Pick<
  CvProjectEntity,
  'id' | 'startDate' | 'endDate' | 'responsibilities'
> {
  @Field(() => ID)
  id!: string;

  @Field(() => Project, {
    description:
      'Catalog project: name, domain, description, environment and the dates the CV dates must fit in',
  })
  project!: Project;

  @Field(() => DateScalar)
  startDate!: Date;

  @Field(() => DateScalar, { nullable: true, description: 'null means "Till now"' })
  endDate!: Date | null;

  @Field(() => [ProjectRole], { description: 'Sorted by name' })
  roles!: ProjectRole[];

  @Field(() => String, {
    nullable: true,
    description: 'Free text, one responsibility per line',
  })
  responsibilities!: string | null;
}
