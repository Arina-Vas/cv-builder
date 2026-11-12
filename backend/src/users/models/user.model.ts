import { Field, ID, ObjectType } from '@nestjs/graphql';
import type { User as UserEntity } from '@/generated/prisma/client';
import { UserRole } from '@/common/graphql/enums';
import { Position } from '@/positions/models/position.model';
import { Department } from '@/departments/models/department.model';

@ObjectType()
export class User implements Pick<
  UserEntity,
  'id' | 'email' | 'avatarKey' | 'emailVerifiedAt' | 'firstName' | 'lastName' | 'role' | 'createdAt'
> {
  @Field(() => ID)
  id!: string;

  @Field()
  email!: string;

  @Field(() => String, { nullable: true })
  firstName!: string | null;

  @Field(() => String, { nullable: true })
  lastName!: string | null;

  avatarKey!: string | null;

  @Field(() => UserRole)
  role!: UserRole;

  @Field(() => Position, { nullable: true })
  position!: Position | null;

  @Field(() => Department, { nullable: true })
  department!: Department | null;

  @Field(() => Date, { nullable: true })
  emailVerifiedAt!: Date | null;

  @Field()
  createdAt!: Date;
}
