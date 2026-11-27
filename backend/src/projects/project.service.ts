import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectsArgs } from '@/projects/dto/projects.args';
import { ProjectList } from '@/projects/models/project-list.model';
import type { Prisma } from '@/generated/prisma/client';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { projectInclude, toProject, toProjectRole } from '@/projects/project.mapper';
import { CreateProjectInput } from '@/projects/dto/create-project.input';
import { Project } from '@/projects/models/project.model';
import { UpdateProjectInput } from '@/projects/dto/update-project.input';
import { badUserInput, entityInUse, type FieldError } from '@/common/errors/app-errors';
import { ErrorReason } from '@/common/errors/error-reason.enum';
import { isPrismaError } from '@/prisma/prisma-errors';
import { Skill } from '@/skills/models/skill.model';
import { skillInclude, toSkill } from '@/skills/skill.mapper';
import { ProjectRole } from '@/projects/models/project-role.model';
import { containsInsensitive } from '@/common/prisma/search';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ sortOrder, sortBy, search }: ProjectsArgs): Promise<ProjectList> {
    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [{ name: containsInsensitive(search) }, { domain: containsInsensitive(search) }],
        }
      : {};

    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const rows = await this.prisma.project.findMany({
      include: projectInclude,
      where,
      orderBy: [{ [sortBy]: order }, { id: 'asc' }],
    });

    return { items: rows.map(toProject), total: rows.length };
  }

  async findTechnologies(): Promise<Skill[]> {
    const rows = await this.prisma.skill.findMany({
      include: skillInclude,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toSkill);
  }

  async findProjectRoles(): Promise<ProjectRole[]> {
    const rows = await this.prisma.projectRole.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toProjectRole);
  }

  async create({ technologyIds, ...input }: CreateProjectInput): Promise<Project> {
    await this.assertTechnologiesExist(technologyIds);

    try {
      const row = await this.prisma.project.create({
        data: { ...input, technologies: { create: technologyIds.map((skillId) => ({ skillId })) } },
        include: projectInclude,
      });

      return toProject(row);
    } catch (error) {
      if (isPrismaError(error, 'P2003'))
        throw badUserInput({
          fields: [{ field: 'technologyIds', message: 'Technology not found' }],
        });
      throw error;
    }
  }

  async update({ id, technologyIds, ...input }: UpdateProjectInput): Promise<Project> {
    await this.assertTechnologiesExist(technologyIds);
    await this.assertCvProjectsWithin(id, input.startDate, input.endDate);

    try {
      const row = await this.prisma.project.update({
        where: { id },
        data: {
          ...input,
          technologies: { deleteMany: {}, create: technologyIds.map((skillId) => ({ skillId })) },
        },
        include: projectInclude,
      });

      return toProject(row);
    } catch (error) {
      if (isPrismaError(error, 'P2003'))
        throw badUserInput({
          fields: [{ field: 'technologyIds', message: 'Technology not found' }],
        });
      throw error;
    }
  }

  async delete(id: string): Promise<string> {
    const assigned = await this.prisma.cvProject.count({ where: { projectId: id } });
    if (assigned > 0) {
      throw entityInUse('Project cannot be deleted because it is currently in use');
    }

    const row = await this.prisma.project.delete({ where: { id } });

    return row.id;
  }

  private async assertCvProjectsWithin(id: string, startDate: Date, endDate: Date): Promise<void> {
    const [startsBefore, endsAfter] = await Promise.all([
      this.prisma.cvProject.count({ where: { projectId: id, startDate: { lt: startDate } } }),
      this.prisma.cvProject.count({
        where: {
          projectId: id,
          OR: [{ startDate: { gt: endDate } }, { endDate: { gt: endDate } }],
        },
      }),
    ]);

    const fields: FieldError[] = [];
    if (startsBefore > 0) {
      fields.push({ field: 'startDate', message: 'CV projects start before this date' });
    }
    if (endsAfter > 0) {
      fields.push({ field: 'endDate', message: 'CV projects end after this date' });
    }

    if (fields.length > 0) {
      throw badUserInput({
        fields,
        message: 'Project dates must include the dates of the CV projects that use it',
        reason: ErrorReason.USED_IN_CVS,
      });
    }
  }

  private async assertTechnologiesExist(technologyIds: string[]) {
    if (technologyIds.length === 0) return;

    const found = await this.prisma.skill.count({ where: { id: { in: technologyIds } } });
    if (found !== technologyIds.length) {
      throw badUserInput({ fields: [{ field: 'technologyIds', message: 'Technology not found' }] });
    }
  }
}
