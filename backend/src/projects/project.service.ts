import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { ProjectsArgs } from '@/projects/dto/projects.args';
import { ProjectList } from '@/projects/models/project-list.model';
import type { Prisma } from '@/generated/prisma/client';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { projectInclude, toProject } from '@/projects/project.mapper';
import { CreateProjectInput } from '@/projects/dto/create-project.input';
import { Project } from '@/projects/models/project.model';
import { UpdateProjectInput } from '@/projects/dto/update-project.input';
import { badUserInput } from '@/common/errors/app-errors';
import { isPrismaError } from '@/prisma/prisma-errors';
import { Skill } from '@/skills/models/skill.model';
import { skillInclude, toSkill } from '@/skills/skill.mapper';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ sortOrder, sortBy, search }: ProjectsArgs): Promise<ProjectList> {
    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [
            {
              name: { contains: search, mode: 'insensitive' },
            },
            {
              domain: { contains: search, mode: 'insensitive' },
            },
          ],
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
        throw badUserInput([{ field: 'technologyIds', message: 'Technology not found' }]);
      throw error;
    }
  }

  async update({ id, technologyIds, ...input }: UpdateProjectInput): Promise<Project> {
    await this.assertTechnologiesExist(technologyIds);
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
        throw badUserInput([{ field: 'technologyIds', message: 'Technology not found' }]);
      throw error;
    }
  }

  async delete(id: string): Promise<string> {
    const row = await this.prisma.project.delete({ where: { id } });

    return row.id;
  }

  private async assertTechnologiesExist(technologyIds: string[]) {
    if (technologyIds.length === 0) return;

    const found = await this.prisma.skill.count({ where: { id: { in: technologyIds } } });
    if (found !== technologyIds.length) {
      throw badUserInput([{ field: 'technologyIds', message: 'Technology not found' }]);
    }
  }
}
