import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsUUID } from 'class-validator';
import { CvsArgs } from '@/cvs/dto/cvs.args';

@ArgsType()
export class UserCvsArgs extends CvsArgs {
  @Field(() => ID)
  @IsUUID('all', { message: 'User is required' })
  userId!: string;
}
