import { ArgsType, Field } from '@nestjs/graphql';
import { PaginatedListArgs } from '@/common/graphql/list.args';
import { DepartmentSortField } from '@/departments/models/department-sort-field.enum';
import { IsEnum } from 'class-validator';

@ArgsType()
export class DepartmentsArgs extends PaginatedListArgs {
  @Field(() => DepartmentSortField, { defaultValue: DepartmentSortField.name })
  @IsEnum(DepartmentSortField)
  sortBy: DepartmentSortField = DepartmentSortField.name;
}
