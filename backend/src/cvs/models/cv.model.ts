import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { Cv as CvEntity } from '@/generated/prisma/client';
import { User } from '@/users/models/user.model';

@ObjectType()
export class Cv implements Pick<CvEntity, 'id' | 'name' | 'education' | 'description'> {
  @Field(() => ID)
  id!: string;

  @Field()
  name!: string;

  @Field()
  education!: string;

  @Field()
  description!: string;

  @Field(() => User)
  user!: User;
}
