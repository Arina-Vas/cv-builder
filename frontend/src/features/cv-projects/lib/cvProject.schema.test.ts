import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { cvProjectSchema, type ProjectPeriod } from './cvProject.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });

// the catalog project p1 runs through 2024
const P1: ProjectPeriod = { startDate: new Date(2024, 0, 1), endDate: new Date(2024, 11, 31) };
const periods: Record<string, ProjectPeriod> = {
  p1: P1,
};
const schema = cvProjectSchema(t, (projectId) => periods[projectId]);

const valid = {
  projectId: 'p1',
  startDate: new Date(2024, 2, 1),
  endDate: new Date(2024, 5, 30),
  roleIds: ['r1'],
  responsibilities: 'Code review',
};

type Values = Omit<typeof valid, 'startDate' | 'endDate'> & {
  startDate: Date | null;
  endDate: Date | null;
};

const messagesOf = (field: keyof Values, values: Partial<Values>) =>
  schema
    .safeParse({ ...valid, ...values })
    .error?.issues.filter((issue) => issue.path[0] === field)
    .map((issue) => issue.message) ?? [];

describe('cvProjectSchema', () => {
  it('accepts a valid CV project and trims the responsibilities', () => {
    expect(schema.parse({ ...valid, responsibilities: '  Code review  ' })).toEqual(valid);
  });

  it('allows an empty end date: the project is still ongoing ("Present")', () => {
    expect(schema.safeParse({ ...valid, endDate: null }).success).toBe(true);
  });

  it('allows empty responsibilities', () => {
    expect(schema.safeParse({ ...valid, responsibilities: '   ' }).success).toBe(true);
  });

  it.each<[keyof Values, Partial<Values>, string]>([
    ['projectId', { projectId: '' }, 'Project is required'],
    ['startDate', { startDate: null }, 'Start date is required'],
    ['roleIds', { roleIds: [] }, 'At least one role must be selected'],
  ])('requires %s', (field, values, message) => {
    expect(messagesOf(field, values)).toEqual([message]);
  });

  it('limits the responsibilities to 2000 characters', () => {
    expect(messagesOf('responsibilities', { responsibilities: 'a'.repeat(2000) })).toEqual([]);
    expect(messagesOf('responsibilities', { responsibilities: 'a'.repeat(2001) })).toEqual([
      'Responsibilities must not exceed 2000 characters',
    ]);
  });

  describe('dates within the project duration', () => {
    it.each([
      ['before the project starts', new Date(2023, 11, 31)],
      ['after the project ends', new Date(2025, 0, 1)],
    ])('rejects a start date %s', (_, startDate) => {
      expect(messagesOf('startDate', { startDate, endDate: null })).toEqual([
        'Start date must be within project duration',
      ]);
    });

    it('accepts the first and the last day of the project', () => {
      expect(
        schema.safeParse({
          ...valid,
          startDate: P1.startDate,
          endDate: P1.endDate,
        }).success,
      ).toBe(true);
    });

    it('rejects an end date after the project ends', () => {
      expect(messagesOf('endDate', { endDate: new Date(2025, 0, 1) })).toEqual([
        'End date must be within project duration',
      ]);
    });

    it('does not check the duration while the project is unknown (options not loaded yet)', () => {
      expect(
        schema.safeParse({
          ...valid,
          projectId: 'p2',
          startDate: new Date(2030, 0, 1),
          endDate: null,
        }).success,
      ).toBe(true);
    });
  });

  describe('end date vs start date', () => {
    it('rejects an end date before the start date, under the end date only', () => {
      expect(messagesOf('endDate', { endDate: new Date(2024, 1, 1) })).toEqual([
        'End date cannot be earlier than start date',
      ]);
      expect(messagesOf('startDate', { endDate: new Date(2024, 1, 1) })).toEqual([]);
    });

    it('accepts the same day', () => {
      expect(messagesOf('endDate', { endDate: valid.startDate })).toEqual([]);
    });

    it('shows one end date message at a time: "earlier than start" wins', () => {
      // also outside the project, but the order of the dates is the first thing to fix
      const result = messagesOf('endDate', {
        startDate: new Date(2024, 0, 10),
        endDate: new Date(2024, 0, 5),
      });
      expect(result).toEqual(['End date cannot be earlier than start date']);
    });

    it('does not compare while the start date is missing: only "required" is shown', () => {
      expect(messagesOf('startDate', { startDate: null })).toEqual(['Start date is required']);
      expect(messagesOf('endDate', { startDate: null })).toEqual([]);
    });
  });
});
