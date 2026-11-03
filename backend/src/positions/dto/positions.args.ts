import { ArgsType, Field } from '@nestjs/graphql';
import { PaginatedListArgs } from '@/common/graphql/list.args';
import { IsEnum } from 'class-validator';
import { PositionSortField } from '@/positions/models/position-sort-field.enum';

@ArgsType()
export class PositionsArgs extends PaginatedListArgs {
  @Field(() => PositionSortField, { defaultValue: PositionSortField.name })
  @IsEnum(PositionSortField)
  sortBy: PositionSortField = PositionSortField.name;
}
