import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { projectSchema } from './project.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = projectSchema(t);

const valid = {
  name: 'Blog',
  domain: 'Blogging',
  description: 'A blogging website',
  technologyIds: ['t1'],
  startDate: new Date(2024, 0, 1),
  endDate: new Date(2024, 11, 31),
};

type Values = Omit<typeof valid, 'startDate' | 'endDate'> & {
  startDate: Date | null;
  endDate: Date | null;
};

// the first message for a field, as the form shows it
const errorOf = (field: keyof Values, values: Partial<Values>) =>
  schema.safeParse({ ...valid, ...values }).error?.issues.find((issue) => issue.path[0] === field)
    ?.message;

describe('projectSchema', () => {
  it('accepts a valid project and trims the texts', () => {
    expect(schema.parse({ ...valid, name: '  Blog  ', domain: ' Blogging ' })).toEqual(valid);
  });

  it('allows a project without technologies (Environment is optional)', () => {
    expect(schema.safeParse({ ...valid, technologyIds: [] }).success).toBe(true);
  });

  it.each([
    ['name', 'Project name is required'],
    ['domain', 'Domain is required'],
    ['description', 'Description is required'],
  ] as const)('requires %s', (field, message) => {
    expect(errorOf(field, { [field]: '   ' })).toBe(message);
  });

  it.each([
    ['name', 100, 'Project name must not exceed 100 characters'],
    ['domain', 100, 'Domain must not exceed 100 characters'],
    ['description', 2000, 'Description must not exceed 2000 characters'],
  ] as const)('limits %s to %i characters', (field, max, message) => {
    expect(errorOf(field, { [field]: 'a'.repeat(max) })).toBeUndefined();
    expect(errorOf(field, { [field]: 'a'.repeat(max + 1) })).toBe(message);
  });

  it.each([
    ['startDate', 'Start date is required'],
    ['endDate', 'End date is required'],
  ] as const)('requires %s', (field, message) => {
    expect(errorOf(field, { [field]: null })).toBe(message);
  });

  describe('end date vs start date', () => {
    it('rejects an end date before the start date, under the end date', () => {
      expect(errorOf('endDate', { endDate: new Date(2023, 11, 31) })).toBe(
        'End date must be later than start date',
      );
    });

    it('accepts the same day, as the backend does', () => {
      expect(errorOf('endDate', { endDate: valid.startDate })).toBeUndefined();
    });

    it('does not compare while a date is missing: only "required" is shown', () => {
      const result = schema.safeParse({ ...valid, endDate: null });
      const endDateMessages = result.error?.issues
        .filter((issue) => issue.path[0] === 'endDate')
        .map((issue) => issue.message);

      expect(endDateMessages).toEqual(['End date is required']);
    });
  });
});
