import type { Prisma } from '@/generated/prisma/client';
import type { UserLanguage } from '@/languages/user-languages/models/user-language.model';
import { toLanguage } from '@/languages/language.mapper';

export const userLanguageInclude = { language: true } satisfies Prisma.UserLanguageInclude;
export type UserLanguageWithLanguage = Prisma.UserLanguageGetPayload<{
  include: typeof userLanguageInclude;
}>;

export const toUserLanguage = (row: UserLanguageWithLanguage): UserLanguage => ({
  id: row.id,
  language: toLanguage(row.language),
  proficiency: row.proficiency,
});
