import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { skillSchema } from './skill.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = skillSchema(t);

const CATEGORY_ID = '6f1c2a3e-1b2c-4d5e-8f90-123456789abc';
const valid = { name: 'React', categoryId: CATEGORY_ID };

// the first message for a field, as the form shows it
const errorOf = (field: keyof typeof valid, value: string) =>
  schema
    .safeParse({ ...valid, [field]: value })
    .error?.issues.find((issue) => issue.path[0] === field)?.message;

describe('skillSchema', () => {
  it('accepts a skill with a category and trims the name', () => {
    expect(schema.parse({ name: '  React  ', categoryId: CATEGORY_ID })).toEqual(valid);
  });

  it('has only the fields of the GraphQL input: the type comes from the category', () => {
    expect(schema.parse({ ...valid, type: 'Frontend' })).toEqual(valid);
  });

  describe('name', () => {
    it.each(['', '   '])('is required (%j)', (value) => {
      expect(errorOf('name', value)).toBe('Skill is required');
    });

    it('allows up to 100 characters', () => {
      expect(errorOf('name', 'a'.repeat(100))).toBeUndefined();
      expect(errorOf('name', 'a'.repeat(101))).toBe('Skill name must not exceed 100 characters');
    });
  });

  // Select keeps '' while nothing is chosen
  it('requires a category', () => {
    expect(errorOf('categoryId', '')).toBe('Category is required');
  });
});
