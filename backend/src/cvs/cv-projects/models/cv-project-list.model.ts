import { ObjectType } from '@nestjs/graphql';
import { Listed } from '@/common/graphql/list.response';
import { CvProject } from '@/cvs/cv-projects/models/cv-project.model';

@ObjectType()
export class CvProjectList extends Listed(CvProject) {}
