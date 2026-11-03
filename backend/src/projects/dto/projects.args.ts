import { ArgsType, Field } from '@nestjs/graphql';
import { ListArgs } from '@/common/graphql/list.args';
import { ProjectSortField } from '@/projects/models/project-sort-field.enum';
import { IsEnum } from 'class-validator';

@ArgsType()
export class ProjectsArgs extends ListArgs {
  @Field(() => ProjectSortField, { defaultValue: ProjectSortField.name })
  @IsEnum(ProjectSortField)
  sortBy: ProjectSortField = ProjectSortField.name;
}
