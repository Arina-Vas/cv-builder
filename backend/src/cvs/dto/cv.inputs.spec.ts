import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_CV_NAME_LENGTH, MAX_DESCRIPTION_LENGTH } from '@/common/graphql/constants';
import { CreateCvInput } from '@/cvs/dto/create-cv.input';
import { UpdateCvInput } from '@/cvs/dto/update-cv.input';
import { CvsArgs } from '@/cvs/dto/cvs.args';
import { UserCvsArgs } from '@/cvs/dto/user-cvs.args';
import { CvSortField } from '@/cvs/models/cv-sort-field.enum';

const USER_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const CV_ID = '9a8b7c6d-5e4f-4a3b-8c2d-1e0f9a8b7c6d';

// A valid input; each test overrides only the field it checks
const VALID_CV = {
  userId: USER_ID,
  name: 'Frontend Developer',
  education: 'BSUIR, Software Engineering',
  description: 'Five years of building web applications',
};

const VALID_UPDATE = { ...VALID_CV, id: CV_ID };

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

describe('CreateCvInput', () => {
  it('accepts a valid CV', () => {
    expect(check(CreateCvInput, VALID_CV).errors).toEqual([]);
  });

  it('normalizes the name and the education', () => {
    const { dto, errors } = check(CreateCvInput, {
      ...VALID_CV,
      name: '  Frontend   Developer ',
      education: ' BSUIR,   Software Engineering ',
    });

    expect(dto.name).toBe('Frontend Developer');
    expect(dto.education).toBe('BSUIR, Software Engineering');
    expect(errors).toEqual([]);
  });

  it('trims the description and keeps its line breaks', () => {
    const { dto, errors } = check(CreateCvInput, {
      ...VALID_CV,
      description: '  Line  1\nLine 2  ',
    });

    expect(dto.description).toBe('Line  1\nLine 2');
    expect(errors).toEqual([]);
  });

  it.each(['name', 'education', 'description'])('rejects a blank %s as required', (field) => {
    expect(check(CreateCvInput, { ...VALID_CV, [field]: '   ' }).errors).toEqual([
      `${field}.isNotEmpty`,
    ]);
  });

  it.each(['name', 'education', 'description'])('requires %s', (field) => {
    const { errors } = check(CreateCvInput, { ...VALID_CV, [field]: undefined });

    expect(errors).toHaveLength(3);
    expect(errors).toEqual(
      expect.arrayContaining([`${field}.isString`, `${field}.isNotEmpty`, `${field}.maxLength`]),
    );
  });

  it.each([
    ['name', MAX_CV_NAME_LENGTH],
    ['education', MAX_CV_NAME_LENGTH],
    ['description', MAX_DESCRIPTION_LENGTH],
  ])('accepts a %s of the maximum length', (field, max) => {
    const plain = { ...VALID_CV, [field]: 'a'.repeat(max) };

    expect(check(CreateCvInput, plain).errors).toEqual([]);
  });

  it.each([
    ['name', MAX_CV_NAME_LENGTH],
    ['education', MAX_CV_NAME_LENGTH],
    ['description', MAX_DESCRIPTION_LENGTH],
  ])('rejects a %s longer than the maximum length', (field, max) => {
    const plain = { ...VALID_CV, [field]: 'a'.repeat(max + 1) };

    expect(check(CreateCvInput, plain).errors).toEqual([`${field}.maxLength`]);
  });

  it.each([undefined, '', '42'])('rejects %p as a user id', (userId) => {
    expect(check(CreateCvInput, { ...VALID_CV, userId }).errors).toEqual(['userId.isUuid']);
  });

  it('uses the required message for a missing user', () => {
    const dto = plainToInstance(CreateCvInput, { ...VALID_CV, userId: undefined });
    const [error] = validateSync(dto);

    expect(error?.constraints).toEqual({ isUuid: 'User is required' });
  });
});

describe('UpdateCvInput', () => {
  it('accepts a valid update', () => {
    expect(check(UpdateCvInput, VALID_UPDATE).errors).toEqual([]);
  });

  it('inherits the normalization rules', () => {
    const { dto, errors } = check(UpdateCvInput, {
      ...VALID_UPDATE,
      name: '  Frontend   Developer ',
    });

    expect(dto.name).toBe('Frontend Developer');
    expect(errors).toEqual([]);
  });

  it('inherits the length rules', () => {
    const plain = { ...VALID_UPDATE, education: 'a'.repeat(MAX_CV_NAME_LENGTH + 1) };

    expect(check(UpdateCvInput, plain).errors).toEqual(['education.maxLength']);
  });

  it('requires the user id', () => {
    expect(check(UpdateCvInput, { ...VALID_UPDATE, userId: undefined }).errors).toEqual([
      'userId.isUuid',
    ]);
  });

  it.each([undefined, '42'])('rejects %p as a CV id', (id) => {
    expect(check(UpdateCvInput, { ...VALID_UPDATE, id }).errors).toEqual(['id.isUuid']);
  });
});

describe('CvsArgs', () => {
  it('sorts by name by default', () => {
    const { dto, errors } = check(CvsArgs, {});

    expect(dto.sortBy).toBe(CvSortField.name);
    expect(errors).toEqual([]);
  });

  it('rejects an unknown sort field', () => {
    expect(check(CvsArgs, { sortBy: 'education' }).errors).toEqual(['sortBy.isEnum']);
  });

  it('has pagination', () => {
    const { dto } = check(CvsArgs, {});

    expect(dto.page).toBe(1);
    expect(dto.pageSize).toBe(10);
  });

  it('treats a blank search as no filter', () => {
    expect(check(CvsArgs, { search: '   ' }).dto.search).toBeUndefined();
  });

  it('has no user filter', () => {
    expect(check(CvsArgs, {}).dto).not.toHaveProperty('userId');
  });
});

describe('UserCvsArgs', () => {
  it('accepts a user id with the default list args', () => {
    const { dto, errors } = check(UserCvsArgs, { userId: USER_ID });

    expect(dto.sortBy).toBe(CvSortField.name);
    expect(dto.page).toBe(1);
    expect(errors).toEqual([]);
  });

  it.each([undefined, '', '42'])('rejects %p as a user id', (userId) => {
    expect(check(UserCvsArgs, { userId }).errors).toEqual(['userId.isUuid']);
  });

  it('inherits the sort field rule', () => {
    expect(check(UserCvsArgs, { userId: USER_ID, sortBy: 'education' }).errors).toEqual([
      'sortBy.isEnum',
    ]);
  });
});
