import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Position as PositionEntity } from '@/generated/prisma/client';

@ObjectType()
export class Position implements Pick<PositionEntity, 'id' | 'name'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;
}
