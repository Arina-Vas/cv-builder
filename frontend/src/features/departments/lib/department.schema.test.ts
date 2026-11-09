import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { departmentSchema } from './department.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = departmentSchema(t);

const errorOf = (name: string) => schema.safeParse({ name }).error?.issues[0]?.message;

describe('departmentSchema', () => {
  it.each(['', '   '])('requires a name (%j)', (name) => {
    expect(errorOf(name)).toBe('Department name is required');
  });

  it('allows up to 100 characters', () => {
    expect(errorOf('a'.repeat(100))).toBeUndefined();
    expect(errorOf('a'.repeat(101))).toBe('Department name must not exceed 100 characters');
  });

  it('trims the name', () => {
    expect(schema.parse({ name: '  HR  ' })).toEqual({ name: 'HR' });
  });
});
