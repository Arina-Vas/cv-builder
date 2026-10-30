import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { CreatePositionInput } from '@/positions/dto/create-position.input';
import { UpdatePositionInput } from '@/positions/dto/update-position.input';
import { PositionsArgs } from '@/positions/dto/positions.args';
import { PositionSortField } from '@/positions/models/position-sort-field.enum';

const VALID_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

describe('CreatePositionInput', () => {
  it('normalizes the name', () => {
    const { dto, errors } = check(CreatePositionInput, { name: '  Senior   Developer ' });

    expect(dto.name).toBe('Senior Developer');
    expect(errors).toEqual([]);
  });

  it('rejects a blank name as required', () => {
    expect(check(CreatePositionInput, { name: '   ' }).errors).toEqual(['name.isNotEmpty']);
  });

  it('accepts a name of the maximum length', () => {
    expect(check(CreatePositionInput, { name: 'a'.repeat(MAX_NAME_LENGTH) }).errors).toEqual([]);
  });

  it('rejects a name longer than the maximum length', () => {
    const { errors } = check(CreatePositionInput, { name: 'a'.repeat(MAX_NAME_LENGTH + 1) });

    expect(errors).toEqual(['name.maxLength']);
  });
});

describe('UpdatePositionInput', () => {
  it('inherits the name rules', () => {
    const { dto, errors } = check(UpdatePositionInput, { id: VALID_ID, name: ' Team  Lead ' });

    expect(dto.name).toBe('Team Lead');
    expect(errors).toEqual([]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(check(UpdatePositionInput, { id: '42', name: 'Team Lead' }).errors).toEqual([
      'id.isUuid',
    ]);
  });
});

describe('PositionsArgs', () => {
  it('sorts by name by default', () => {
    const { dto, errors } = check(PositionsArgs, {});

    expect(dto.sortBy).toBe(PositionSortField.name);
    expect(errors).toEqual([]);
  });

  it('rejects an unknown sort field', () => {
    expect(check(PositionsArgs, { sortBy: 'NAME' }).errors).toEqual(['sortBy.isEnum']);
  });

  it('keeps the inherited pagination rules', () => {
    expect(check(PositionsArgs, { pageSize: 15 }).errors).toEqual(['pageSize.isIn']);
  });

  it('treats a blank search as no filter', () => {
    expect(check(PositionsArgs, { search: '   ' }).dto.search).toBeUndefined();
  });
});
