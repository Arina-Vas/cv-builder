import { ArgsType, Field } from '@nestjs/graphql';
import { IsEnum } from 'class-validator';
import { PaginatedListArgs } from '@/common/graphql/list.args';
import { CvSortField } from '@/cvs/models/cv-sort-field.enum';

@ArgsType()
export class CvsArgs extends PaginatedListArgs {
  @Field(() => CvSortField, { defaultValue: CvSortField.name })
  @IsEnum(CvSortField)
  sortBy: CvSortField = CvSortField.name;
}
