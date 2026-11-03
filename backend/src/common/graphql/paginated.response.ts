import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export function Paginated<T>(ItemType: Type<T>): abstract new () => PaginatedResult<T> {
  @ObjectType({ isAbstract: true })
  abstract class PaginatedType implements PaginatedResult<T> {
    @Field(() => [ItemType])
    items!: T[];

    @Field(() => Int, { description: 'Items matching the search, not the page size' })
    total!: number;

    @Field(() => Int, { description: 'Current page, 1-based' })
    page!: number;

    @Field(() => Int)
    pageSize!: number;
  }

  return PaginatedType;
}
