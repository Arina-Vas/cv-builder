import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Type } from '@nestjs/common';

export interface ListedResult<T> {
  items: T[];
  total: number;
}

export function Listed<T>(ItemType: Type<T>): abstract new () => ListedResult<T> {
  @ObjectType({ isAbstract: true })
  abstract class ListedType implements ListedResult<T> {
    @Field(() => [ItemType])
    items!: T[];

    @Field(() => Int, { description: 'Items matching the search' })
    total!: number;
  }

  return ListedType;
}
