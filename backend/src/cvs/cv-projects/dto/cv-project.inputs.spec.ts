import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_DESCRIPTION_LENGTH } from '@/common/graphql/constants';
import { SortOrder } from '@/common/graphql/sort-order.enum';
import { CreateCvProjectInput } from '@/cvs/cv-projects/dto/create-cv-project.input';
import { UpdateCvProjectInput } from '@/cvs/cv-projects/dto/update-cv-project.input';
import { CvProjectsArgs } from '@/cvs/cv-projects/dto/cv-projects.args';
import { CvProjectSortField } from '@/cvs/cv-projects/models/cv-project-sort-field.enum';

const CV_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';
const PROJECT_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const ROLE_ID = '1c2d3e4f-5a6b-4c7d-8e9f-0a1b2c3d4e5f';
const OTHER_ROLE_ID = '2d3e4f5a-6b7c-4d8e-9f0a-1b2c3d4e5f6a';
const CV_PROJECT_ID = '4e5f6a7b-8c9d-4e0f-8a1b-2c3d4e5f6a7b';

// Dates arrive as Date objects: the Date scalar parses them before validation
const VALID = {
  cvId: CV_ID,
  projectId: PROJECT_ID,
  startDate: new Date('2026-01-01T00:00:00.000Z'),
  endDate: new Date('2026-06-30T00:00:00.000Z'),
  roleIds: [ROLE_ID],
  responsibilities: 'Wrote the API\nSet up CI',
};

const { projectId: _projectId, ...VALID_UPDATE_FIELDS } = VALID;
const VALID_UPDATE = { ...VALID_UPDATE_FIELDS, id: CV_PROJECT_ID };

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  const messages = validateSync(dto).flatMap((error) => Object.values(error.constraints ?? {}));
  return { dto, errors, messages };
};

describe('CreateCvProjectInput', () => {
  it('accepts a valid CV project', () => {
    expect(check(CreateCvProjectInput, VALID).errors).toEqual([]);
  });

  it.each([null, undefined])('accepts a missing end date (%s) as "Till now"', (endDate) => {
    expect(check(CreateCvProjectInput, { ...VALID, endDate }).errors).toEqual([]);
  });

  it('accepts an end date equal to the start date', () => {
    expect(check(CreateCvProjectInput, { ...VALID, endDate: VALID.startDate }).errors).toEqual([]);
  });

  it('rejects an end date before the start date with the spec message', () => {
    const { errors, messages } = check(CreateCvProjectInput, {
      ...VALID,
      endDate: new Date('2025-12-31T00:00:00.000Z'),
    });

    expect(errors).toEqual(['endDate.isNotBeforeDate']);
    expect(messages).toEqual(['End date cannot be earlier than start date']);
  });

  it('rejects a missing start date with the spec message', () => {
    const { messages } = check(CreateCvProjectInput, { ...VALID, startDate: undefined });

    expect(messages).toEqual(['Start date is required']);
  });

  it('rejects a missing project with the spec message', () => {
    const { messages } = check(CreateCvProjectInput, { ...VALID, projectId: undefined });

    expect(messages).toEqual(['Project is required']);
  });

  it('rejects an empty role list with the spec message', () => {
    const { errors, messages } = check(CreateCvProjectInput, { ...VALID, roleIds: [] });

    expect(errors).toEqual(['roleIds.arrayNotEmpty']);
    expect(messages).toEqual(['At least one role must be selected']);
  });

  it('rejects repeated roles and role ids that are not UUIDs', () => {
    expect(check(CreateCvProjectInput, { ...VALID, roleIds: [ROLE_ID, ROLE_ID] }).errors).toEqual([
      'roleIds.arrayUnique',
    ]);
    expect(check(CreateCvProjectInput, { ...VALID, roleIds: ['developer'] }).errors).toEqual([
      'roleIds.isUuid',
    ]);
  });

  it('trims responsibilities and keeps line breaks between them', () => {
    const { dto, errors } = check(CreateCvProjectInput, {
      ...VALID,
      responsibilities: '  Wrote the API\nSet up CI  ',
    });

    expect(dto.responsibilities).toBe('Wrote the API\nSet up CI');
    expect(errors).toEqual([]);
  });

  it('accepts no responsibilities', () => {
    expect(check(CreateCvProjectInput, { ...VALID, responsibilities: null }).errors).toEqual([]);
  });

  it(`rejects responsibilities longer than ${MAX_DESCRIPTION_LENGTH} characters`, () => {
    const { errors } = check(CreateCvProjectInput, {
      ...VALID,
      responsibilities: 'a'.repeat(MAX_DESCRIPTION_LENGTH + 1),
    });

    expect(errors).toEqual(['responsibilities.maxLength']);
  });
});

describe('UpdateCvProjectInput', () => {
  it('accepts a valid update and changes the role set', () => {
    expect(
      check(UpdateCvProjectInput, { ...VALID_UPDATE, roleIds: [ROLE_ID, OTHER_ROLE_ID] }).errors,
    ).toEqual([]);
  });

  it('keeps the create rules for dates and roles', () => {
    expect(
      check(UpdateCvProjectInput, {
        ...VALID_UPDATE,
        endDate: new Date('2025-12-31T00:00:00.000Z'),
        roleIds: [],
      }).errors.sort(),
    ).toEqual(['endDate.isNotBeforeDate', 'roleIds.arrayNotEmpty']);
  });

  it('requires a UUID id', () => {
    expect(check(UpdateCvProjectInput, { ...VALID_UPDATE, id: 'cv-project-1' }).errors).toEqual([
      'id.isUuid',
    ]);
  });
});

describe('CvProjectsArgs', () => {
  it('sorts by name ascending by default', () => {
    const { dto, errors } = check(CvProjectsArgs, { cvId: CV_ID });

    expect(errors).toEqual([]);
    expect(dto.sortBy).toBe(CvProjectSortField.name);
    expect(dto.sortOrder).toBe(SortOrder.ASC);
  });

  it('accepts only whitelisted sort fields', () => {
    expect(check(CvProjectsArgs, { cvId: CV_ID, sortBy: 'endDate' }).errors).toEqual([]);
    expect(check(CvProjectsArgs, { cvId: CV_ID, sortBy: 'responsibilities' }).errors).toEqual([
      'sortBy.isEnum',
    ]);
  });

  it('treats a blank search as no search', () => {
    expect(check(CvProjectsArgs, { cvId: CV_ID, search: '   ' }).dto.search).toBeUndefined();
  });

  it('requires a CV', () => {
    expect(check(CvProjectsArgs, {}).errors).toEqual(['cvId.isUuid']);
  });
});
