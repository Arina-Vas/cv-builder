import { registerEnumType } from '@nestjs/graphql';

export enum LanguageSortField {
  name = 'name',
  iso = 'iso',
}

registerEnumType(LanguageSortField, { name: 'LanguageSortField' });
