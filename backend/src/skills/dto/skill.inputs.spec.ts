import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { CreateSkillInput } from '@/skills/dto/create-skill.input';
import { UpdateSkillInput } from '@/skills/dto/update-skill.input';
import { SkillsArgs } from '@/skills/dto/skills.args';
import { SkillSortField } from '@/skills/models/skill-sort-field.enum';

const VALID_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const VALID_CATEGORY_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5a';

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

const VALID_SKILL = { name: 'Firebase', categoryId: VALID_CATEGORY_ID };

describe('CreateSkillInput', () => {
  it('normalizes the name', () => {
    const { dto, errors } = check(CreateSkillInput, { ...VALID_SKILL, name: '  Test Skill ' });

    expect(dto.name).toBe('Test Skill');
    expect(errors).toEqual([]);
  });

  it('rejects a blank name as required', () => {
    expect(check(CreateSkillInput, { ...VALID_SKILL, name: '   ' }).errors).toEqual([
      'name.isNotEmpty',
    ]);
  });

  it('accepts a name of the maximum length', () => {
    expect(
      check(CreateSkillInput, { ...VALID_SKILL, name: 'a'.repeat(MAX_NAME_LENGTH) }).errors,
    ).toEqual([]);
  });

  it('rejects a name longer than the maximum length', () => {
    const { errors } = check(CreateSkillInput, {
      ...VALID_SKILL,
      name: 'a'.repeat(MAX_NAME_LENGTH + 1),
    });

    expect(errors).toEqual(['name.maxLength']);
  });

  it('accepts a valid skill', () => {
    expect(check(CreateSkillInput, VALID_SKILL).errors).toEqual([]);
  });

  it.each([undefined, '', 'backend'])('rejects %p as a category id', (categoryId) => {
    expect(check(CreateSkillInput, { ...VALID_SKILL, categoryId }).errors).toEqual([
      'categoryId.isUuid',
    ]);
  });
});

describe('UpdateSkillInput', () => {
  it('inherits the name rules', () => {
    const { dto, errors } = check(UpdateSkillInput, {
      ...VALID_SKILL,
      id: VALID_ID,
      name: ' Test Skill ',
    });

    expect(dto.name).toBe('Test Skill');
    expect(errors).toEqual([]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(
      check(UpdateSkillInput, { ...VALID_SKILL, id: '42', name: 'Test Skill' }).errors,
    ).toEqual(['id.isUuid']);
  });
});

describe('SkillsArgs', () => {
  it('sorts by name by default', () => {
    const { dto, errors } = check(SkillsArgs, {});

    expect(dto.sortBy).toBe(SkillSortField.name);
    expect(errors).toEqual([]);
  });

  it('rejects an unknown sort field', () => {
    expect(check(SkillsArgs, { sortBy: 'NAME' }).errors).toEqual(['sortBy.isEnum']);
  });

  it('keeps the inherited pagination rules', () => {
    expect(check(SkillsArgs, { pageSize: 15 }).errors).toEqual(['pageSize.isIn']);
  });

  it('treats a blank search as no filter', () => {
    expect(check(SkillsArgs, { search: '   ' }).dto.search).toBeUndefined();
  });
});
