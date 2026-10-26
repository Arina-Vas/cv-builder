import { ArgsType, Field, Int } from '@nestjs/graphql';
import { Transform } from 'class-transformer';
import { SortOrder } from './sort-order.enum';
import { IsEnum, IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import {
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  DEFAULT_SORT_ORDER,
  MAX_SEARCH_LENGTH,
  PAGE_SIZES,
} from './constants';

@ArgsType()
export class ListArgs {
  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_SEARCH_LENGTH)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() || undefined : value))
  search?: string;

  @Field(() => SortOrder, { defaultValue: DEFAULT_SORT_ORDER })
  @IsEnum(SortOrder)
  sortOrder: SortOrder = DEFAULT_SORT_ORDER;
}

@ArgsType()
export class PaginatedListArgs extends ListArgs {
  @Field(() => Int, { defaultValue: DEFAULT_PAGE, description: '1-based page number' })
  @IsInt()
  @Min(1)
  page: number = DEFAULT_PAGE;

  @Field(() => Int, { defaultValue: DEFAULT_PAGE_SIZE, description: 'One of 10, 20, 50' })
  @IsInt()
  @IsIn(PAGE_SIZES)
  pageSize: number = DEFAULT_PAGE_SIZE;
}
