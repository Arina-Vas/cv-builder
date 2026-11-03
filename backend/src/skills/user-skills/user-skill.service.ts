import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { toUserSkill, userSkillInclude } from '@/skills/user-skills/user-skill.mapper';
import type { UserSkill } from '@/skills/user-skills/models/user-skill.model';
import type { CreateUserSkillInput } from '@/skills/user-skills/dto/create-user-skill.input';
import type { UpdateUserSkillInput } from '@/skills/user-skills/dto/update-user-skill.input';
import type { DeleteUserSkillsArgs } from '@/skills/user-skills/dto/delete-user-skills.args';
import { canManageUser } from '@/common/auth/can-manage-user';
import { badUserInput, conflict, forbidden, notFound } from '@/common/errors/app-errors';
import type { User } from '@/users/models/user.model';
import { isPrismaError } from '@/prisma/prisma-errors';
import type { Skill } from '@/skills/models/skill.model';
import { skillInclude, toSkill } from '@/skills/skill.mapper';

@Injectable()
export class UserSkillService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<UserSkill[]> {
    await this.assertUserExists(userId);

    const rows = await this.prisma.userSkill.findMany({
      where: { userId },
      include: userSkillInclude,
      // The page groups skills by category, so rows of one category come together
      orderBy: [
        { skill: { category: { name: 'asc' } } },
        { skill: { name: 'asc' } },
        { id: 'asc' },
      ],
    });

    return rows.map(toUserSkill);
  }

  async findAvailable(userId: string): Promise<Skill[]> {
    await this.assertUserExists(userId);

    const rows = await this.prisma.skill.findMany({
      where: { users: { none: { userId } } },
      include: skillInclude,
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toSkill);
  }

  async create(
    currentUser: User,
    { userId, skillId, mastery }: CreateUserSkillInput,
  ): Promise<UserSkill> {
    await this.assertCanManage(currentUser, userId);
    await this.assertSkillExists(skillId);

    try {
      const row = await this.prisma.userSkill.create({
        data: { mastery, skillId, userId },
        include: userSkillInclude,
      });

      return toUserSkill(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002'))
        throw conflict('skillId', 'Skill is already assigned to the user');
      if (isPrismaError(error, 'P2003'))
        throw badUserInput([{ field: 'skillId', message: 'Skill not found' }]);
      throw error;
    }
  }

  async update(
    currentUser: User,
    { userId, mastery, id }: UpdateUserSkillInput,
  ): Promise<UserSkill> {
    await this.assertCanManage(currentUser, userId);

    const row = await this.prisma.userSkill.update({
      where: { id, userId },
      data: { mastery },
      include: userSkillInclude,
    });

    return toUserSkill(row);
  }

  async delete(currentUser: User, { ids, userId }: DeleteUserSkillsArgs): Promise<string[]> {
    await this.assertCanManage(currentUser, userId);

    const rows = await this.prisma.userSkill.findMany({
      where: { userId, id: { in: ids } },
      select: { id: true },
    });

    const found = rows.map((row) => row.id);

    await this.prisma.userSkill.deleteMany({
      where: { userId, id: { in: found } },
    });

    return found;
  }

  private async assertCanManage(currentUser: User, userId: string) {
    if (!canManageUser(currentUser, userId)) {
      throw forbidden();
    }
    await this.assertUserExists(userId);
  }

  private async assertUserExists(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } });

    if (!user) throw notFound('User not found');
  }

  private async assertSkillExists(skillId: string) {
    const skill = await this.prisma.skill.findUnique({
      where: { id: skillId },
      select: { id: true },
    });

    if (!skill) throw badUserInput([{ field: 'skillId', message: 'Skill not found' }]);
  }
}
