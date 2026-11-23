import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CvAccessService } from '@/cvs/cv-access.service';
import { cvSkillInclude, ownerHasSkill, toCvSkill } from './cv-skill.mapper';
import { skillInclude, toSkill } from '@/skills/skill.mapper';
import type { User } from '@/users/models/user.model';
import type { CvSkill } from './models/cv-skill.model';
import type { Skill } from '@/skills/models/skill.model';
import type { CreateCvSkillInput } from './dto/create-cv-skill.input';
import type { DeleteCvSkillsArgs } from './dto/delete-cv-skills.args';
import { isPrismaError } from '@/prisma/prisma-errors';
import { badUserInput, conflict, forbidden } from '@/common/errors/app-errors';

@Injectable()
export class CvSkillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cvAccess: CvAccessService,
  ) {}

  async findByCv(currentUser: User, cvId: string): Promise<CvSkill[]> {
    const cv = await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const rows = await this.prisma.cvSkill.findMany({
      where: { cvId, ...ownerHasSkill(cv.userId) },
      include: cvSkillInclude(cv.userId),
      orderBy: [
        { skill: { category: { name: 'asc' } } },
        { skill: { name: 'asc' } },
        { id: 'asc' },
      ],
    });
    return rows.map(toCvSkill);
  }

  async findAvailable(currentUser: User, cvId: string): Promise<Skill[]> {
    const cv = await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const rows = await this.prisma.skill.findMany({
      where: {
        users: { some: { userId: cv.userId } },
        cvs: { none: { cvId } },
      },
      include: skillInclude,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toSkill);
  }

  async create(currentUser: User, { cvId, skillId }: CreateCvSkillInput): Promise<CvSkill> {
    const cv = await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const ownerSkill = await this.prisma.userSkill.findUnique({
      where: { userId_skillId: { userId: cv.userId, skillId } },
      select: { id: true },
    });
    if (!ownerSkill) {
      throw badUserInput([{ field: 'skillId', message: 'Skill is not assigned to the CV owner' }]);
    }

    try {
      const row = await this.prisma.cvSkill.create({
        data: { cvId, skillId },
        include: cvSkillInclude(cv.userId),
      });

      return toCvSkill(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002'))
        throw conflict('skillId', 'Skill is already assigned to the CV');

      throw error;
    }
  }

  async delete(currentUser: User, { cvId, ids }: DeleteCvSkillsArgs): Promise<string[]> {
    await this.cvAccess.getAccessibleCv(cvId, currentUser);

    const rows = await this.prisma.cvSkill.findMany({
      where: { id: { in: ids } },
      select: { id: true, cvId: true },
    });

    if (rows.some((row) => row.cvId !== cvId)) {
      throw forbidden('Skill belongs to another CV');
    }

    const found = rows.map((row) => row.id);

    await this.prisma.cvSkill.deleteMany({
      where: { cvId, id: { in: found } },
    });

    return found;
  }
}
