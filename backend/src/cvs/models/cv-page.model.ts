import { Paginated } from '@/common/graphql/paginated.response';
import { ObjectType } from '@nestjs/graphql';
import { Cv } from '@/cvs/models/cv.model';

@ObjectType()
export class CvPage extends Paginated(Cv) {}
