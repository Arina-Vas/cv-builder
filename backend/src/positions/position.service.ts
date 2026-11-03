import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PositionsArgs } from '@/positions/dto/positions.args';
import { PositionPage } from '@/positions/models/position-page.model';
import { CreatePositionInput } from '@/positions/dto/create-position.input';
import { Position } from '@/positions/models/position.model';
import { UpdatePositionInput } from '@/positions/dto/update-position.input';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import type { Prisma } from '@/generated/prisma/client';
import { toPosition } from '@/positions/position.mapper';
import { isPrismaError } from '@/prisma/prisma-errors';
import { conflict } from '@/common/errors/app-errors';

@Injectable()
export class PositionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll({
    search,
    sortBy,
    sortOrder,
    page,
    pageSize,
  }: PositionsArgs): Promise<PositionPage> {
    const where: Prisma.PositionWhereInput = search
      ? { name: { contains: search, mode: 'insensitive' } }
      : {};

    const order: Prisma.SortOrder = sortOrder === SortOrder.ASC ? 'asc' : 'desc';

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.position.findMany({
        where,
        orderBy: [{ [sortBy]: order }, { id: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.position.count({ where }),
    ]);

    return {
      items: rows.map(toPosition),
      page,
      pageSize,
      total,
    };
  }

  async create({ name }: CreatePositionInput): Promise<Position> {
    try {
      const row = await this.prisma.position.create({
        data: { name },
      });

      return toPosition(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw conflict('name', 'Position already exists');
      }
      throw error;
    }
  }

  async update({ name, id }: UpdatePositionInput): Promise<Position> {
    try {
      const row = await this.prisma.position.update({
        where: { id },
        data: { name },
      });

      return toPosition(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002')) {
        throw conflict('name', 'Position already exists');
      }
      throw error;
    }
  }

  async delete(id: string): Promise<string> {
    const row = await this.prisma.position.delete({ where: { id } });

    return row.id;
  }
}
