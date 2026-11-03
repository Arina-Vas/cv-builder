import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { DepartmentSortField } from '@/departments/models/department-sort-field.enum';
import { CreateDepartmentInput } from './create-department.input';
import { DepartmentsArgs } from './departments.args';
import { UpdateDepartmentInput } from './update-department.input';

const VALID_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

describe('CreateDepartmentInput', () => {
  it('normalizes the name', () => {
    const { dto, errors } = check(CreateDepartmentInput, { name: '  Human   Resources ' });

    expect(dto.name).toBe('Human Resources');
    expect(errors).toEqual([]);
  });

  it('rejects a blank name as required', () => {
    expect(check(CreateDepartmentInput, { name: '   ' }).errors).toEqual(['name.isNotEmpty']);
  });

  it('accepts a name of the maximum length', () => {
    expect(check(CreateDepartmentInput, { name: 'a'.repeat(MAX_NAME_LENGTH) }).errors).toEqual([]);
  });

  it('rejects a name longer than the maximum length', () => {
    const { errors } = check(CreateDepartmentInput, { name: 'a'.repeat(MAX_NAME_LENGTH + 1) });

    expect(errors).toEqual(['name.maxLength']);
  });
});

describe('UpdateDepartmentInput', () => {
  it('inherits the name rules', () => {
    const { dto, errors } = check(UpdateDepartmentInput, { id: VALID_ID, name: ' Sales  Team ' });

    expect(dto.name).toBe('Sales Team');
    expect(errors).toEqual([]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(check(UpdateDepartmentInput, { id: '42', name: 'Sales' }).errors).toEqual(['id.isUuid']);
  });
});

describe('DepartmentsArgs', () => {
  it('sorts by name by default', () => {
    const { dto, errors } = check(DepartmentsArgs, {});

    expect(dto.sortBy).toBe(DepartmentSortField.name);
    expect(errors).toEqual([]);
  });

  it('rejects an unknown sort field', () => {
    expect(check(DepartmentsArgs, { sortBy: 'NAME' }).errors).toEqual(['sortBy.isEnum']);
  });

  it('keeps the inherited pagination rules', () => {
    expect(check(DepartmentsArgs, { pageSize: 15 }).errors).toEqual(['pageSize.isIn']);
  });

  it('treats a blank search as no filter', () => {
    expect(check(DepartmentsArgs, { search: '   ' }).dto.search).toBeUndefined();
  });
});
