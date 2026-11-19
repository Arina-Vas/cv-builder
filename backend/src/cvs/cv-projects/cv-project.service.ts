import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { Prisma, Project as ProjectEntity } from '@/generated/prisma/client';
import { badUserInput, conflict, notFound, type FieldError } from '@/common/errors/app-errors';
import { isPrismaError } from '@/prisma/prisma-errors';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import type { User } from '@/users/models/user.model';
import { CvAccessService } from '@/cvs/cv-access.service';
import { cvProjectInclude, toCvProject } from '@/cvs/cv-projects/cv-project.mapper';
import { CvProject } from '@/cvs/cv-projects/models/cv-project.model';
import { CvProjectList } from '@/cvs/cv-projects/models/cv-project-list.model';
import { CvProjectSortField } from '@/cvs/cv-projects/models/cv-project-sort-field.enum';
import { CvProjectsArgs } from '@/cvs/cv-projects/dto/cv-projects.args';
import { CreateCvProjectInput } from '@/cvs/cv-projects/dto/create-cv-project.input';
import { UpdateCvProjectInput } from '@/cvs/cv-projects/dto/update-cv-project.input';
import { Project } from '@/projects/models/project.model';
import { projectInclude, toProject } from '@/projects/project.mapper';

type ProjectPeriod = Pick<ProjectEntity, 'startDate' | 'endDate'>;

@Injectable()
export class CvProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvAccess: CvAccessService,
  ) {}

  async findAll(
    currentUser: User,
    { cvId, search, sortBy, sortOrder }: CvProjectsArgs,
  ): Promise<CvProjectList> {
    await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const where: Prisma.CvProjectWhereInput = {
      cvId,
      ...(search && {
        project: {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { domain: { contains: search, mode: 'insensitive' } },
          ],
        },
      }),
    };

    const rows = await this.prisma.cvProject.findMany({
      where,
      include: cvProjectInclude,
      orderBy: [this.orderBy(sortBy, sortOrder), { id: 'asc' }],
    });

    return { items: rows.map(toCvProject), total: rows.length };
  }

  async findAvailable(currentUser: User, cvId: string): Promise<Project[]> {
    await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const rows = await this.prisma.project.findMany({
      where: { cvs: { none: { cvId } } },
      include: projectInclude,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toProject);
  }

  async create(
    currentUser: User,
    { cvId, projectId, startDate, endDate, roleIds, responsibilities }: CreateCvProjectInput,
  ): Promise<CvProject> {
    await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { startDate: true, endDate: true },
    });
    if (!project) throw badUserInput([{ field: 'projectId', message: 'Project not found' }]);

    this.assertWithinProject(project, startDate, endDate);
    await this.assertRolesExist(roleIds);

    try {
      const row = await this.prisma.cvProject.create({
        data: {
          cvId,
          projectId,
          startDate,
          endDate: endDate ?? null,
          responsibilities: responsibilities || null,
          roles: { create: roleIds.map((roleId) => ({ roleId })) },
        },
        include: cvProjectInclude,
      });

      return toCvProject(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002'))
        throw conflict('projectId', 'Project is already added to the CV');
      if (isPrismaError(error, 'P2003'))
        throw badUserInput([{ field: 'roleIds', message: 'Role not found' }]);
      throw error;
    }
  }

  async update(
    currentUser: User,
    { id, cvId, startDate, endDate, roleIds, responsibilities }: UpdateCvProjectInput,
  ): Promise<CvProject> {
    await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const existing = await this.prisma.cvProject.findFirst({
      where: { id, cvId },
      select: { project: { select: { startDate: true, endDate: true } } },
    });
    if (!existing) throw notFound('CV project not found');

    this.assertWithinProject(existing.project, startDate, endDate);
    await this.assertRolesExist(roleIds);

    try {
      const row = await this.prisma.cvProject.update({
        where: { id },
        data: {
          startDate,
          endDate: endDate ?? null,
          responsibilities: responsibilities || null,
          roles: { deleteMany: {}, create: roleIds.map((roleId) => ({ roleId })) },
        },
        include: cvProjectInclude,
      });

      return toCvProject(row);
    } catch (error) {
      if (isPrismaError(error, 'P2003'))
        throw badUserInput([{ field: 'roleIds', message: 'Role not found' }]);
      if (isPrismaError(error, 'P2025')) throw notFound('CV project not found');
      throw error;
    }
  }

  async delete(currentUser: User, id: string, cvId: string): Promise<string> {
    await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const { count } = await this.prisma.cvProject.deleteMany({ where: { id, cvId } });
    if (count === 0) throw notFound('CV project not found');

    return id;
  }

  private orderBy(
    sortBy: CvProjectSortField,
    sortOrder: SortOrder,
  ): Prisma.CvProjectOrderByWithRelationInput {
    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    switch (sortBy) {
      case CvProjectSortField.name:
        return { project: { name: order } };
      case CvProjectSortField.startDate:
        return { startDate: order };
      case CvProjectSortField.endDate:
        return { endDate: { sort: order, nulls: order === 'asc' ? 'last' : 'first' } };
    }
  }

  private assertWithinProject(
    project: ProjectPeriod,
    startDate: Date,
    endDate: Date | null | undefined,
  ): void {
    const fields: FieldError[] = [];

    if (startDate < project.startDate || startDate > project.endDate) {
      fields.push({ field: 'startDate', message: 'Start date must be within project duration' });
    }
    if (endDate && (endDate < project.startDate || endDate > project.endDate)) {
      fields.push({ field: 'endDate', message: 'End date must be within project duration' });
    }

    if (fields.length > 0) throw badUserInput(fields);
  }

  private async assertRolesExist(roleIds: string[]): Promise<void> {
    const found = await this.prisma.projectRole.count({ where: { id: { in: roleIds } } });

    if (found !== roleIds.length) {
      throw badUserInput([{ field: 'roleIds', message: 'Role not found' }]);
    }
  }
}
