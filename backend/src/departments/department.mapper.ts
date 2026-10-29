import type { Department as DepartmentEntity } from '@/generated/prisma/client';
import type { Department } from '@/departments/models/department.model';

export const toDepartment = (row: DepartmentEntity): Department => ({
  name: row.name,
  id: row.id,
});
