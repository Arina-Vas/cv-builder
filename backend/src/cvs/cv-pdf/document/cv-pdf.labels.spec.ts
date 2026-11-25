import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Locale } from '@/common/graphql/locale.enum';
import { CV_PDF_LABELS } from './cv-pdf.labels';

type Messages = { [key: string]: string | Messages };

const MESSAGES_DIR = join(__dirname, '../../../../../frontend/messages');

const readMessages = (locale: string): Messages =>
  JSON.parse(readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf8')) as Messages;

const isGroup = (value: unknown): value is Messages =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Same as mergeMessages in frontend/src/i18n/merge-messages.ts: missing keys keep the English text */
const mergeMessages = (fallback: Messages, translation: Messages): Messages => {
  const result: Messages = { ...fallback };
  for (const [key, value] of Object.entries(translation)) {
    const base = result[key];
    result[key] = isGroup(base) && isGroup(value) ? mergeMessages(base, value) : value;
  }
  return result;
};

/** What the CV Preview shows in this locale: the same texts the PDF must use */
const getPreviewLabels = (locale: Locale) => {
  const en = readMessages(Locale.en);
  const messages = locale === Locale.en ? en : mergeMessages(en, readMessages(locale));
  const { cvs, userLanguage } = messages as {
    cvs: { preview: { document: Messages } };
    userLanguage: { proficiencyLevel: Messages };
  };

  return { ...cvs.preview.document, proficiency: userLanguage.proficiencyLevel };
};

describe('CV PDF labels', () => {
  it('cover every UI locale of the frontend', () => {
    const frontendLocales = readdirSync(MESSAGES_DIR)
      .filter((file) => file.endsWith('.json'))
      .map((file) => file.replace(/\.json$/, ''));

    expect(Object.values(Locale).sort()).toEqual(frontendLocales.sort());
    expect(Object.keys(CV_PDF_LABELS).sort()).toEqual(frontendLocales.sort());
  });

  it.each(Object.values(Locale))('match the CV Preview texts in %s', (locale) => {
    expect(CV_PDF_LABELS[locale]).toEqual(getPreviewLabels(locale));
  });
});
