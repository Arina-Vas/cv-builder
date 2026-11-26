import { registerEnumType } from '@nestjs/graphql';

export enum CvSortField {
  name = 'name',
}

registerEnumType(CvSortField, { name: 'CvSortField' });
