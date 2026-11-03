import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { canManageUser } from '@/common/auth/can-manage-user';
import { badUserInput, conflict, forbidden, notFound } from '@/common/errors/app-errors';
import type { User } from '@/users/models/user.model';
import { isPrismaError } from '@/prisma/prisma-errors';
import { UserLanguage } from '@/languages/user-languages/models/user-language.model';
import {
  toUserLanguage,
  userLanguageInclude,
} from '@/languages/user-languages/user-language.mapper';
import { Language } from '@/languages/models/language.model';
import { toLanguage } from '@/languages/language.mapper';
import { CreateUserLanguageInput } from '@/languages/user-languages/dto/create-user-language.input';
import { UpdateUserLanguageInput } from '@/languages/user-languages/dto/update-user-language.input';
import { DeleteUserLanguagesArgs } from '@/languages/user-languages/dto/delete-user-languages.args';

@Injectable()
export class UserLanguageService {
  constructor(private readonly prisma: PrismaService) {}

  async findByUser(userId: string): Promise<UserLanguage[]> {
    await this.assertUserExists(userId);

    const rows = await this.prisma.userLanguage.findMany({
      where: { userId },
      include: userLanguageInclude,
      orderBy: [{ language: { name: 'asc' } }, { id: 'asc' }],
    });

    return rows.map(toUserLanguage);
  }

  async findAvailable(userId: string): Promise<Language[]> {
    await this.assertUserExists(userId);

    const rows = await this.prisma.language.findMany({
      where: { users: { none: { userId } } },
      orderBy: [{ name: 'asc' }, { id: 'asc' }],
    });

    return rows.map(toLanguage);
  }

  async create(
    currentUser: User,
    { userId, languageId, proficiency }: CreateUserLanguageInput,
  ): Promise<UserLanguage> {
    await this.assertCanManage(currentUser, userId);
    await this.assertLanguageExists(languageId);

    try {
      const row = await this.prisma.userLanguage.create({
        data: { proficiency, languageId, userId },
        include: userLanguageInclude,
      });

      return toUserLanguage(row);
    } catch (error) {
      if (isPrismaError(error, 'P2002'))
        throw conflict('languageId', 'Language is already assigned to the user');
      if (isPrismaError(error, 'P2003'))
        throw badUserInput([{ field: 'languageId', message: 'Language not found' }]);
      throw error;
    }
  }

  async update(
    currentUser: User,
    { userId, proficiency, id }: UpdateUserLanguageInput,
  ): Promise<UserLanguage> {
    await this.assertCanManage(currentUser, userId);

    const row = await this.prisma.userLanguage.update({
      where: { id, userId },
      data: { proficiency },
      include: userLanguageInclude,
    });

    return toUserLanguage(row);
  }

  async delete(currentUser: User, { ids, userId }: DeleteUserLanguagesArgs): Promise<string[]> {
    await this.assertCanManage(currentUser, userId);

    const rows = await this.prisma.userLanguage.findMany({
      where: { userId, id: { in: ids } },
      select: { id: true },
    });

    const found = rows.map((row) => row.id);

    await this.prisma.userLanguage.deleteMany({
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

  private async assertLanguageExists(languageId: string) {
    const language = await this.prisma.language.findUnique({
      where: { id: languageId },
      select: { id: true },
    });

    if (!language) throw badUserInput([{ field: 'languageId', message: 'Language not found' }]);
  }
}
