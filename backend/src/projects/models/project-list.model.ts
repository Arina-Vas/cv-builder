import { ObjectType } from '@nestjs/graphql';
import { Project } from '@/projects/models/project.model';
import { Listed } from '@/common/graphql/list.response';

@ObjectType()
export class ProjectList extends Listed(Project) {}
