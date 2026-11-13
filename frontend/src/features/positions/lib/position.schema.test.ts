import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { positionSchema } from './position.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = positionSchema(t);

const errorOf = (name: string) => schema.safeParse({ name }).error?.issues[0]?.message;

describe('positionSchema', () => {
  it.each(['', '   '])('requires a name (%j)', (name) => {
    expect(errorOf(name)).toBe('Position name is required');
  });

  it('allows up to 100 characters', () => {
    expect(errorOf('a'.repeat(100))).toBeUndefined();
    expect(errorOf('a'.repeat(101))).toBe('Position name must not exceed 100 characters');
  });

  it('trims the name', () => {
    expect(schema.parse({ name: '  QA Engineer  ' })).toEqual({ name: 'QA Engineer' });
  });
});
