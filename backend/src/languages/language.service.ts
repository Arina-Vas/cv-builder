import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LanguagePage } from '@/languages/models/language-page.model';
import { LanguagesArgs } from '@/languages/dto/languages.args';
import type { Prisma } from '@/generated/prisma/client';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { toLanguage } from '@/languages/language.mapper';
import { CreateLanguageInput } from '@/languages/dto/create-language.input';
import { Language } from '@/languages/models/language.model';
import { conflict } from '@/common/errors/app-errors';
import { UpdateLanguageInput } from '@/languages/dto/update-language.input';

@Injectable()
export class LanguageService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    search,
    sortBy,
    sortOrder,
    page,
    pageSize,
  }: LanguagesArgs): Promise<LanguagePage> {
    const where: Prisma.LanguageWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.language.findMany({
        where,
        orderBy: [{ [sortBy]: order }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.language.count({ where }),
    ]);

    return { items: rows.map(toLanguage), page, pageSize, total };
  }

  async create(input: CreateLanguageInput): Promise<Language> {
    await this.assertUnique(input);

    return toLanguage(await this.prisma.language.create({ data: input }));
  }

  async update({ id, ...input }: UpdateLanguageInput): Promise<Language> {
    await this.assertUnique(input, id);

    return toLanguage(await this.prisma.language.update({ where: { id }, data: input }));
  }

  async delete(id: string): Promise<string> {
    const row = await this.prisma.language.delete({
      where: { id },
    });

    return row.id;
  }

  private async assertUnique({ name, iso }: CreateLanguageInput, id?: string): Promise<void> {
    const [byName, byIso] = await Promise.all([
      this.prisma.language.findUnique({ where: { name }, select: { id: true } }),
      this.prisma.language.findUnique({ where: { iso }, select: { id: true } }),
    ]);

    if (byName && byName.id !== id) throw conflict('name', 'Language already exists');
    if (byIso && byIso.id !== id) throw conflict('iso', 'ISO code already exists');
  }
}
