import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../../messages/en.json';
import { userLanguageSchema } from './userLanguage.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = userLanguageSchema(t);

const valid = { languageId: 'l1', proficiency: 'B2' };

const errorOf = (field: keyof typeof valid, value: string) =>
  schema
    .safeParse({ ...valid, [field]: value })
    .error?.issues.find((issue) => issue.path[0] === field)?.message;

describe('userLanguageSchema', () => {
  it('accepts a language with a proficiency', () => {
    expect(schema.parse(valid)).toEqual(valid);
  });

  // the selects keep '' while nothing is chosen
  it('requires a language', () => {
    expect(errorOf('languageId', '')).toBe('Language is required');
  });

  it('requires a proficiency', () => {
    expect(errorOf('proficiency', '')).toBe('Language proficiency is required');
  });

  it('rejects a proficiency the backend does not know', () => {
    expect(schema.safeParse({ ...valid, proficiency: 'D1' }).success).toBe(false);
  });
});
