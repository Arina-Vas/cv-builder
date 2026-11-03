import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { ProjectRole as ProjectRoleEntity } from '@/generated/prisma/client';

@ObjectType()
export class ProjectRole implements Pick<ProjectRoleEntity, 'id' | 'name'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}
