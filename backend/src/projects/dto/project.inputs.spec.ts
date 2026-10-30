import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_DESCRIPTION_LENGTH, MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { CreateProjectInput } from '@/projects/dto/create-project.input';
import { ProjectsArgs } from '@/projects/dto/projects.args';
import { UpdateProjectInput } from '@/projects/dto/update-project.input';
import { ProjectSortField } from '@/projects/models/project-sort-field.enum';

const VALID_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const OTHER_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

const date = (day: string): Date => new Date(`${day}T00:00:00.000Z`);

// A valid input; each test overrides only the field it checks
const VALID_PROJECT = {
  name: 'CV Builder',
  domain: 'HR',
  description: 'Internal tool for employee CVs',
  startDate: date('2025-03-01'),
  endDate: date('2025-12-31'),
  technologyIds: [VALID_ID],
};

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

describe('CreateProjectInput', () => {
  it('accepts a valid project', () => {
    expect(check(CreateProjectInput, VALID_PROJECT).errors).toEqual([]);
  });

  it('normalizes the name and the domain', () => {
    const { dto, errors } = check(CreateProjectInput, {
      ...VALID_PROJECT,
      name: '  CV   Builder ',
      domain: ' Human   Resources ',
    });

    expect(dto.name).toBe('CV Builder');
    expect(dto.domain).toBe('Human Resources');
    expect(errors).toEqual([]);
  });

  it('trims the description and keeps its line breaks', () => {
    const { dto, errors } = check(CreateProjectInput, {
      ...VALID_PROJECT,
      description: '  Line  1\nLine 2  ',
    });

    expect(dto.description).toBe('Line  1\nLine 2');
    expect(errors).toEqual([]);
  });

  it.each(['name', 'domain', 'description'])('rejects a blank %s as required', (field) => {
    expect(check(CreateProjectInput, { ...VALID_PROJECT, [field]: '   ' }).errors).toEqual([
      `${field}.isNotEmpty`,
    ]);
  });

  it.each([
    ['name', MAX_NAME_LENGTH],
    ['domain', MAX_NAME_LENGTH],
    ['description', MAX_DESCRIPTION_LENGTH],
  ])('accepts a %s of the maximum length', (field, max) => {
    const plain = { ...VALID_PROJECT, [field]: 'a'.repeat(max) };

    expect(check(CreateProjectInput, plain).errors).toEqual([]);
  });

  it.each([
    ['name', MAX_NAME_LENGTH],
    ['domain', MAX_NAME_LENGTH],
    ['description', MAX_DESCRIPTION_LENGTH],
  ])('rejects a %s longer than the maximum length', (field, max) => {
    const plain = { ...VALID_PROJECT, [field]: 'a'.repeat(max + 1) };

    expect(check(CreateProjectInput, plain).errors).toEqual([`${field}.maxLength`]);
  });

  it.each(['startDate', 'endDate'])('requires %s', (field) => {
    expect(check(CreateProjectInput, { ...VALID_PROJECT, [field]: undefined }).errors).toEqual([
      `${field}.isDate`,
    ]);
  });

  it('accepts an end date equal to the start date', () => {
    const plain = { ...VALID_PROJECT, endDate: VALID_PROJECT.startDate };

    expect(check(CreateProjectInput, plain).errors).toEqual([]);
  });

  it('rejects an end date before the start date', () => {
    const plain = { ...VALID_PROJECT, endDate: date('2025-02-28') };

    expect(check(CreateProjectInput, plain).errors).toEqual(['endDate.isNotBeforeDate']);
  });

  it('defaults technologies to an empty list', () => {
    const { technologyIds: _omitted, ...withoutTechnologies } = VALID_PROJECT;
    const { dto, errors } = check(CreateProjectInput, withoutTechnologies);

    expect(dto.technologyIds).toEqual([]);
    expect(errors).toEqual([]);
  });

  it('accepts several technologies', () => {
    const plain = { ...VALID_PROJECT, technologyIds: [VALID_ID, OTHER_ID] };

    expect(check(CreateProjectInput, plain).errors).toEqual([]);
  });

  it('rejects a repeated technology', () => {
    const plain = { ...VALID_PROJECT, technologyIds: [VALID_ID, VALID_ID] };

    expect(check(CreateProjectInput, plain).errors).toEqual(['technologyIds.arrayUnique']);
  });

  it('rejects a technology id that is not a UUID', () => {
    const plain = { ...VALID_PROJECT, technologyIds: [VALID_ID, '42'] };

    expect(check(CreateProjectInput, plain).errors).toEqual(['technologyIds.isUuid']);
  });
});

describe('UpdateProjectInput', () => {
  it('inherits the normalization rules', () => {
    const { dto, errors } = check(UpdateProjectInput, {
      ...VALID_PROJECT,
      id: VALID_ID,
      name: '  CV   Builder ',
    });

    expect(dto.name).toBe('CV Builder');
    expect(errors).toEqual([]);
  });

  it('inherits the date range rule', () => {
    const plain = { ...VALID_PROJECT, id: VALID_ID, endDate: date('2025-02-28') };

    expect(check(UpdateProjectInput, plain).errors).toEqual(['endDate.isNotBeforeDate']);
  });

  it('rejects an id that is not a UUID', () => {
    expect(check(UpdateProjectInput, { ...VALID_PROJECT, id: '42' }).errors).toEqual(['id.isUuid']);
  });
});

describe('ProjectsArgs', () => {
  it('sorts by name by default', () => {
    const { dto, errors } = check(ProjectsArgs, {});

    expect(dto.sortBy).toBe(ProjectSortField.name);
    expect(errors).toEqual([]);
  });

  it.each(['startDate', 'endDate'])('accepts sorting by %s', (sortBy) => {
    expect(check(ProjectsArgs, { sortBy }).errors).toEqual([]);
  });

  it('rejects an unknown sort field', () => {
    expect(check(ProjectsArgs, { sortBy: 'domain' }).errors).toEqual(['sortBy.isEnum']);
  });

  it('has no pagination', () => {
    expect(check(ProjectsArgs, {}).dto).not.toHaveProperty('page');
  });

  it('treats a blank search as no filter', () => {
    expect(check(ProjectsArgs, { search: '   ' }).dto.search).toBeUndefined();
  });
});
