import { Proficiency } from '@/common/graphql/enums';
import {
  toUserLanguage,
  type UserLanguageWithLanguage,
} from '@/languages/user-languages/user-language.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: UserLanguageWithLanguage = {
  id: 'user-language-1',
  userId: 'user-1',
  languageId: 'language-1',
  proficiency: Proficiency.B1,
  language: {
    id: 'language-1',
    name: 'English',
    createdAt,
    updatedAt: createdAt,
    iso: 'EN',
    nativeName: 'English',
  },
  createdAt,
  updatedAt: createdAt,
};

describe('toUserLanguage', () => {
  it('maps the assignment with its language and drops service fields', () => {
    expect(toUserLanguage(row)).toEqual({
      id: 'user-language-1',
      proficiency: Proficiency.B1,
      language: {
        id: 'language-1',
        name: 'English',
        iso: 'EN',
        nativeName: 'English',
      },
    });
  });
});
