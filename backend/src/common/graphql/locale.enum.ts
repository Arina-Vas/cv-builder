import { registerEnumType } from '@nestjs/graphql';

export enum Locale {
  en = 'en',
  fr = 'fr',
  de = 'de',
  it = 'it',
  pl = 'pl',
  pt = 'pt',
  ru = 'ru',
  es = 'es',
  uk = 'uk',
}

registerEnumType(Locale, { name: 'Locale' });
