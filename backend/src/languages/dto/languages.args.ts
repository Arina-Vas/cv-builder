import { ArgsType, Field } from '@nestjs/graphql';
import { PaginatedListArgs } from '@/common/graphql/list.args';
import { LanguageSortField } from '@/languages/models/language-sort-field.enum';
import { IsEnum } from 'class-validator';

@ArgsType()
export class LanguagesArgs extends PaginatedListArgs {
  @Field(() => LanguageSortField, { defaultValue: LanguageSortField.name })
  @IsEnum(LanguageSortField)
  sortBy: LanguageSortField = LanguageSortField.name;
}
