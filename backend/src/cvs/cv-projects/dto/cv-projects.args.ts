import { ArgsType, Field, ID } from '@nestjs/graphql';
import { IsEnum, IsUUID } from 'class-validator';
import { ListArgs } from '@/common/graphql/list.args';
import { CvProjectSortField } from '@/cvs/cv-projects/models/cv-project-sort-field.enum';

@ArgsType()
export class CvProjectsArgs extends ListArgs {
  @Field(() => ID)
  @IsUUID('all', { message: 'CV is required' })
  cvId!: string;

  @Field(() => CvProjectSortField, { defaultValue: CvProjectSortField.name })
  @IsEnum(CvProjectSortField)
  sortBy: CvProjectSortField = CvProjectSortField.name;
}
