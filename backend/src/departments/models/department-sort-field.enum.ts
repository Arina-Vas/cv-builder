import { registerEnumType } from '@nestjs/graphql';

export enum DepartmentSortField {
  name = 'name',
}

registerEnumType(DepartmentSortField, { name: 'DepartmentSortField' });
