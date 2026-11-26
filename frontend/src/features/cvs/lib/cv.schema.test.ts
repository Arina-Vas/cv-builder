import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { cvSchema } from '@/features/cvs/lib/cv.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = cvSchema(t);

const valid = {
  name: 'Cv test',
  description: 'Software Engineer with 5+ years of experience',
  education: 'Software Engineer',
};

type Values = typeof valid;

// the first message for a field, as the form shows it
const errorOf = (field: keyof Values, values: Partial<Values>) =>
  schema.safeParse({ ...valid, ...values }).error?.issues.find((issue) => issue.path[0] === field)
    ?.message;

describe('cvSchema', () => {
  it('accepts a valid cv and trims the texts', () => {
    expect(
      schema.parse({
        name: '  Cv test ',
        education: ' Software Engineer ',
        description: ' Software Engineer with 5+ years of experience ',
      }),
    ).toEqual(valid);
  });

  it.each([
    ['name', 'Name is required'],
    ['education', 'Education is required'],
    ['description', 'Description is required'],
  ] as const)('requires %s', (field, message) => {
    expect(errorOf(field, { [field]: '   ' })).toBe(message);
  });

  it.each([
    ['name', 255, 'Name must not exceed 255 characters'],
    ['education', 255, 'Education must not exceed 255 characters'],
    ['description', 2000, 'Description must not exceed 2000 characters'],
  ] as const)('limits %s to %i characters', (field, max, message) => {
    expect(errorOf(field, { [field]: 'a'.repeat(max) })).toBeUndefined();
    expect(errorOf(field, { [field]: 'a'.repeat(max + 1) })).toBe(message);
  });
});
