import { Module } from '@nestjs/common';
import { DepartmentResolver } from '@/departments/department.resolver';
import { DepartmentService } from '@/departments/department.service';

@Module({
  providers: [DepartmentResolver, DepartmentService],
})
export class DepartmentModule {}
