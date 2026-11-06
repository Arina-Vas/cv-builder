import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginatedListArgs } from '@/common/graphql/list.args';
import { UserSortField } from '@/users/models/user-sort-field.enum';

@ArgsType()
export class UsersArgs extends PaginatedListArgs {
  @Field(() => UserSortField, {
    nullable: true,
    description: 'Without it users are returned in creation order and sortOrder is ignored',
  })
  @IsOptional()
  @IsEnum(UserSortField)
  sortBy?: UserSortField;
}
