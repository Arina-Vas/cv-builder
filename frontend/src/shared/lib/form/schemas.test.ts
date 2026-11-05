import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import messages from '../../../../messages/en.json';
import { optionalString, requiredDate, requiredIds, requiredString } from './schemas';

const firstMessage = (result: { error?: z.ZodError }) => result.error?.issues[0]?.message;

describe('requiredString', () => {
  const schema = requiredString('Name is required');

  it.each(['', '   '])('rejects %j with the given message', (value) => {
    const result = schema.safeParse(value);

    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe('Name is required');
  });

  it('trims the value on output', () => {
    expect(schema.parse('  Engineering  ')).toBe('Engineering');
  });

  it('can be chained with a max length', () => {
    const limited = requiredString('Name is required').max(3, { error: 'Max 3 characters' });

    expect(firstMessage(limited.safeParse('abcd'))).toBe('Max 3 characters');
    expect(limited.parse(' abc ')).toBe('abc');
  });

  it('reports the error on the field path inside an object', () => {
    const result = z.object({ name: schema }).safeParse({ name: '' });

    expect(result.error?.issues[0]?.path).toEqual(['name']);
  });

  it('shows a translated message from the validation namespace', () => {
    const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });

    expect(firstMessage(requiredString(t('email.required')).safeParse(''))).toBe(
      'Email is required',
    );
  });
});

describe('optionalString', () => {
  const schema = optionalString();

  it('accepts an empty value', () => {
    expect(schema.parse('')).toBe('');
  });

  it('trims the value on output', () => {
    expect(schema.parse('  text  ')).toBe('text');
  });
});

describe('requiredIds', () => {
  it('rejects an empty selection with the given message', () => {
    const result = requiredIds('Select at least one role').safeParse([]);

    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe('Select at least one role');
  });

  it('accepts one selected id', () => {
    expect(requiredIds('Select at least one role').parse(['id-1'])).toEqual(['id-1']);
  });

  it('respects a custom minimum', () => {
    const schema = requiredIds('Select at least two', 2);

    expect(firstMessage(schema.safeParse(['id-1']))).toBe('Select at least two');
    expect(schema.parse(['id-1', 'id-2'])).toEqual(['id-1', 'id-2']);
  });
});

describe('requiredDate', () => {
  const schema = requiredDate('Start Date is required');

  it('rejects null with the given message', () => {
    const result = schema.safeParse(null);

    expect(result.success).toBe(false);
    expect(firstMessage(result)).toBe('Start Date is required');
  });

  it('returns the date as is', () => {
    const date = new Date(2024, 0, 15);

    expect(schema.parse(date)).toBe(date);
  });

  it('rejects a value that is not a date', () => {
    expect(schema.safeParse('2024-01-15').success).toBe(false);
  });
});
