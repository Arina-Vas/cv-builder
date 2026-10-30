import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { SkillsArgs } from '@/skills/dto/skills.args';
import type { Prisma } from '@/generated/prisma/client';
import { SkillPage } from '@/skills/models/skill-page.model';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { skillInclude, toSkill, toSkillCategory } from '@/skills/skill.mapper';
import { CreateSkillInput } from '@/skills/dto/create-skill.input';
import { isPrismaError } from '@/prisma/prisma-errors';
import { badUserInput, conflict } from '@/common/errors/app-errors';
import { Skill } from '@/skills/models/skill.model';
import { UpdateSkillInput } from '@/skills/dto/update-skill.input';
import { SkillCategory } from '@/skills/models/skill-category.model';

@Injectable()
export class SkillService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({ search, sortBy, sortOrder, page, pageSize }: SkillsArgs): Promise<SkillPage> {
    const where: Prisma.SkillWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};
    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        include: skillInclude,
        where,
        orderBy: [{ [sortBy]: order }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.skill.count({ where }),
    ]);

    return { items: rows.map(toSkill), page, pageSize, total };
  }

  async findCategories(): Promise<SkillCategory[]> {
    const rows = await this.prisma.skillCategory.findMany({
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toSkillCategory);
  }

  async create({ name, categoryId }: CreateSkillInput): Promise<Skill> {
    await this.assertCategoryExists(categoryId);

    try {
      const row = await this.prisma.skill.create({
        data: { name, categoryId },
        include: skillInclude,
      });

      return toSkill(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) throw conflict('name', 'Skill already exists');
      if (isPrismaError(error, 'P2003'))
        throw badUserInput([{ field: 'categoryId', message: 'Category not found' }]);
      throw error;
    }
  }

  async update({ name, categoryId, id }: UpdateSkillInput): Promise<Skill> {
    await this.assertCategoryExists(categoryId);

    try {
      const row = await this.prisma.skill.update({
        where: { id },
        data: { name, categoryId },
        include: skillInclude,
      });

      return toSkill(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) throw conflict('name', 'Skill already exists');
      if (isPrismaError(error, 'P2003'))
        throw badUserInput([{ field: 'categoryId', message: 'Category not found' }]);
      throw error;
    }
  }

  async delete(id: string): Promise<string> {
    const row = await this.prisma.skill.delete({ where: { id } });

    return row.id;
  }

  private async assertCategoryExists(categoryId: string) {
    const category = await this.prisma.skillCategory.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw badUserInput([{ field: 'categoryId', message: 'Category not found' }]);
    }
  }
}
