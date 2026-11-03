import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Department as DepartmentEntity } from '@/generated/prisma/client';

@ObjectType()
export class Department implements Pick<DepartmentEntity, 'id' | 'name'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}
