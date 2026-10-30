import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreatePositionInput } from '@/positions/dto/create-position.input';

@InputType()
export class UpdatePositionInput extends CreatePositionInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
