import { registerEnumType } from '@nestjs/graphql';

export enum CvProjectSortField {
  name = 'name',
  startDate = 'startDate',
  endDate = 'endDate',
}

registerEnumType(CvProjectSortField, {
  name: 'CvProjectSortField',
  description:
    '`name` sorts by the project name; a missing end date ("Till now") counts as the latest',
});
