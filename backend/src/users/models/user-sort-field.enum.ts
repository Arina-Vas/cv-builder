import { registerEnumType } from '@nestjs/graphql';

export enum UserSortField {
  firstName = 'firstName',
  lastName = 'lastName',
  department = 'department',
  position = 'position',
}

registerEnumType(UserSortField, { name: 'UserSortField' });
