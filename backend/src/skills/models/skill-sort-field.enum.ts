import { registerEnumType } from '@nestjs/graphql';

export enum SkillSortField {
  name = 'name',
}

registerEnumType(SkillSortField, { name: 'SkillSortField' });
