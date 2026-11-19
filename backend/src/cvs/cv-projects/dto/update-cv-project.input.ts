import { Field, ID, InputType, PickType } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CreateCvProjectInput } from '@/cvs/cv-projects/dto/create-cv-project.input';

@InputType()
export class UpdateCvProjectInput extends PickType(CreateCvProjectInput, [
  'cvId',
  'startDate',
  'endDate',
  'roleIds',
  'responsibilities',
] as const) {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
