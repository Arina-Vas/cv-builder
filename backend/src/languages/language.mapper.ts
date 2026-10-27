import type { Language as LanguageEntity } from '@/generated/prisma/client';
import type { Language } from '@/languages/models/language.model';

export const toLanguage = (row: LanguageEntity): Language => ({
  name: row.name,
  iso: row.iso,
  nativeName: row.nativeName,
  id: row.id,
});
