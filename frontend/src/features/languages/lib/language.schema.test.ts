import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { languageSchema } from './language.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = languageSchema(t);

const valid = { name: 'English', nativeName: 'English', iso: 'EN' };

// the first message for a field, as the form shows it
const errorOf = (field: keyof typeof valid, value: string) =>
  schema
    .safeParse({ ...valid, [field]: value })
    .error?.issues.find((issue) => issue.path[0] === field)?.message;

describe('languageSchema', () => {
  it('accepts a valid language', () => {
    expect(schema.parse(valid)).toEqual(valid);
  });

  it('trims all fields', () => {
    expect(schema.parse({ name: ' German ', nativeName: ' Deutsch ', iso: ' DE ' })).toEqual({
      name: 'German',
      nativeName: 'Deutsch',
      iso: 'DE',
    });
  });

  describe.each([
    ['name', 'Name'],
    ['nativeName', 'Native name'],
  ] as const)('%s', (field, label) => {
    it.each(['', '   '])('is required (%j)', (value) => {
      expect(errorOf(field, value)).toBe(`${label} is required`);
    });

    it('allows up to 100 characters', () => {
      expect(errorOf(field, 'a'.repeat(100))).toBeUndefined();
      expect(errorOf(field, 'a'.repeat(101))).toBe(`${label} must not exceed 100 characters`);
    });
  });

  describe('iso', () => {
    it.each(['', '   '])('is required (%j)', (value) => {
      expect(errorOf('iso', value)).toBe('ISO is required');
    });

    it.each([
      ['en', 'EN'],
      ['deu', 'DEU'],
      [' pt-br ', 'PT-BR'],
    ])('is uppercased: %j → %j', (value, expected) => {
      expect(schema.parse({ ...valid, iso: value }).iso).toBe(expected);
    });

    it('allows up to 5 characters, with an ISO message', () => {
      expect(errorOf('iso', 'ENGLISH')).toBe('ISO must not exceed 5 characters');
    });

    it.each(['E', 'E1', 'EN-', 'EN-U', 'E-NG'])('rejects %j as not a language code', (value) => {
      expect(errorOf('iso', value)).toBe('ISO must be a language code, e.g. EN or PT-BR');
    });
  });
});
