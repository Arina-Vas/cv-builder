import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { DepartmentsArgs } from '@/departments/dto/departments.args';
import { DepartmentPage } from '@/departments/models/department-page.model';
import type { Prisma } from '@/generated/prisma/client';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { toDepartment } from '@/departments/department.mapper';
import { Department } from '@/departments/models/department.model';
import { CreateDepartmentInput } from '@/departments/dto/create-department.input';
import { conflict } from '@/common/errors/app-errors';
import { isPrismaError } from '@/prisma/prisma-errors';
import { UpdateDepartmentInput } from '@/departments/dto/update-department.input';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    search,
    sortBy,
    sortOrder,
    page,
    pageSize,
  }: DepartmentsArgs): Promise<DepartmentPage> {
    const where: Prisma.DepartmentWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.department.findMany({
        where,
        orderBy: [{ [sortBy]: order }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.department.count({ where }),
    ]);

    return { items: rows.map(toDepartment), page, pageSize, total };
  }

  async create({ name }: CreateDepartmentInput): Promise<Department> {
    try {
      const row = await this.prisma.department.create({
        data: { name },
      });

      return toDepartment(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw conflict('name', 'Department already exists');
      }
      throw error;
    }
  }

  async update({ name, id }: UpdateDepartmentInput): Promise<Department> {
    try {
      const row = await this.prisma.department.update({ where: { id }, data: { name } });

      return toDepartment(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw conflict('name', 'Department already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<string> {
    const row = await this.prisma.department.delete({ where: { id } });

    return row.id;
  }
}
