import { registerEnumType } from '@nestjs/graphql';

export enum PositionSortField {
  name = 'name',
}

registerEnumType(PositionSortField, { name: 'PositionSortField' });
