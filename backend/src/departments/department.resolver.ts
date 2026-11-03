import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ParseUUIDPipe } from '@nestjs/common';
import { Department } from '@/departments/models/department.model';
import { CreateDepartmentInput } from '@/departments/dto/create-department.input';
import { UpdateDepartmentInput } from '@/departments/dto/update-department.input';
import { UserRole } from '@/common/graphql/enums';
import { Roles } from '@/common/auth/roles.decorator';
import { DepartmentPage } from '@/departments/models/department-page.model';
import { DepartmentsArgs } from '@/departments/dto/departments.args';
import { DepartmentService } from '@/departments/department.service';

@Resolver(() => Department)
export class DepartmentResolver {
  constructor(private readonly departmentService: DepartmentService) {}

  @Query(() => DepartmentPage)
  departments(@Args() args: DepartmentsArgs): Promise<DepartmentPage> {
    return this.departmentService.findAll(args);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Department)
  createDepartment(@Args('input') input: CreateDepartmentInput): Promise<Department> {
    return this.departmentService.create(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => Department)
  updateDepartment(@Args('input') input: UpdateDepartmentInput): Promise<Department> {
    return this.departmentService.update(input);
  }

  @Roles(UserRole.ADMIN)
  @Mutation(() => ID, {
    description: 'Fails with ENTITY_IN_USE if the department is assigned to users',
  })
  deleteDepartment(@Args('id', { type: () => ID }, ParseUUIDPipe) id: string): Promise<string> {
    return this.departmentService.delete(id);
  }
}
