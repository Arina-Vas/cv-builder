import { Field, ID, InputType, PickType } from '@nestjs/graphql';
import { CreateUserInput } from '@/users/dto/create-user.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PickType(CreateUserInput, [
  'departmentId',
  'positionId',
  'role',
] as const) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
