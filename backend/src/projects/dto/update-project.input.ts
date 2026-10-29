import { Field, ID, InputType } from '@nestjs/graphql';
import { CreateProjectInput } from '@/projects/dto/create-project.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateProjectInput extends CreateProjectInput {
  @Field(() => ID)
  @IsUUID()
  id!: string;
}
