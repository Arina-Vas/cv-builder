import { registerEnumType } from '@nestjs/graphql';

export enum CvProjectSortField {
  name = 'name',
  startDate = 'startDate',
  endDate = 'endDate',
}

registerEnumType(CvProjectSortField, {
  name: 'CvProjectSortField',
  description:
    '`name` sorts by the project name; `endDate` by the end date the table shows: a missing CV end date is ' +
    'the project end date once the project has ended, otherwise "Till now", which counts as the latest',
});
