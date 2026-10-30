import { Paginated } from '@/common/graphql/paginated.response';
import { Department } from '@/departments/models/department.model';
import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class DepartmentPage extends Paginated(Department) {}
