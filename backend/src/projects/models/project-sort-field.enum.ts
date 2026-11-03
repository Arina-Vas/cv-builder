import { registerEnumType } from '@nestjs/graphql';

export enum ProjectSortField {
  name = 'name',
  startDate = 'startDate',
  endDate = 'endDate',
}

registerEnumType(ProjectSortField, { name: 'ProjectSortField' });
