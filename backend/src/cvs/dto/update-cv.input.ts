import { Field, ID, InputType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateCvInput } from '@/cvs/dto/create-cv.input';

@InputType()
export class UpdateCvInput extends CreateCvInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
