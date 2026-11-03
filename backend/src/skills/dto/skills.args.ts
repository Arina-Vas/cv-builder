import { ArgsType, Field } from '@nestjs/graphql';
import { PaginatedListArgs } from '@/common/graphql/list.args';
import { SkillSortField } from '@/skills/models/skill-sort-field.enum';
import { IsEnum } from 'class-validator';

@ArgsType()
export class SkillsArgs extends PaginatedListArgs {
  @Field(() => SkillSortField, { defaultValue: SkillSortField.name })
  @IsEnum(SkillSortField)
  sortBy: SkillSortField = SkillSortField.name;
}
