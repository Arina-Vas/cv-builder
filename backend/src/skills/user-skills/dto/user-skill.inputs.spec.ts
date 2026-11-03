import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Mastery } from '@/common/graphql/enums';
import { CreateUserSkillInput } from '@/skills/user-skills/dto/create-user-skill.input';
import { UpdateUserSkillInput } from '@/skills/user-skills/dto/update-user-skill.input';
import { DeleteUserSkillsArgs } from '@/skills/user-skills/dto/delete-user-skills.args';

const USER_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const SKILL_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5a';
const USER_SKILL_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5b';
const OTHER_USER_SKILL_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5c';

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

const VALID_CREATE = { userId: USER_ID, skillId: SKILL_ID, mastery: Mastery.INTERMEDIATE };
const VALID_UPDATE = { id: USER_SKILL_ID, userId: USER_ID, mastery: Mastery.EXPERT };

describe('CreateUserSkillInput', () => {
  it('accepts a valid assignment', () => {
    expect(check(CreateUserSkillInput, VALID_CREATE).errors).toEqual([]);
  });

  it.each(Object.values(Mastery))('accepts %s as mastery', (mastery) => {
    expect(check(CreateUserSkillInput, { ...VALID_CREATE, mastery }).errors).toEqual([]);
  });

  it.each([undefined, '', 'react'])('rejects %p as a skill id', (skillId) => {
    expect(check(CreateUserSkillInput, { ...VALID_CREATE, skillId }).errors).toEqual([
      'skillId.isUuid',
    ]);
  });

  it.each([undefined, '', '42'])('rejects %p as a user id', (userId) => {
    expect(check(CreateUserSkillInput, { ...VALID_CREATE, userId }).errors).toEqual([
      'userId.isUuid',
    ]);
  });

  // NOVICE was renamed to BEGINNER; an old client value must not pass
  it.each([undefined, 'NOVICE', 'beginner'])('rejects %p as mastery', (mastery) => {
    expect(check(CreateUserSkillInput, { ...VALID_CREATE, mastery }).errors).toEqual([
      'mastery.isEnum',
    ]);
  });
});

describe('UpdateUserSkillInput', () => {
  it('accepts a valid update without a skill id', () => {
    expect(check(UpdateUserSkillInput, VALID_UPDATE).errors).toEqual([]);
  });

  it('inherits the mastery rule', () => {
    expect(check(UpdateUserSkillInput, { ...VALID_UPDATE, mastery: 'NOVICE' }).errors).toEqual([
      'mastery.isEnum',
    ]);
  });

  it('inherits the user id rule', () => {
    expect(check(UpdateUserSkillInput, { ...VALID_UPDATE, userId: '42' }).errors).toEqual([
      'userId.isUuid',
    ]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(check(UpdateUserSkillInput, { ...VALID_UPDATE, id: '42' }).errors).toEqual([
      'id.isUuid',
    ]);
  });
});

describe('DeleteUserSkillsArgs', () => {
  it('accepts several assignment ids', () => {
    const { dto, errors } = check(DeleteUserSkillsArgs, {
      userId: USER_ID,
      ids: [USER_SKILL_ID, OTHER_USER_SKILL_ID],
    });

    expect(dto.ids).toEqual([USER_SKILL_ID, OTHER_USER_SKILL_ID]);
    expect(errors).toEqual([]);
  });

  it('rejects an empty list', () => {
    expect(check(DeleteUserSkillsArgs, { userId: USER_ID, ids: [] }).errors).toEqual([
      'ids.arrayNotEmpty',
    ]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(
      check(DeleteUserSkillsArgs, { userId: USER_ID, ids: [USER_SKILL_ID, 'x'] }).errors,
    ).toEqual(['ids.isUuid']);
  });

  it('rejects duplicate ids', () => {
    expect(
      check(DeleteUserSkillsArgs, { userId: USER_ID, ids: [USER_SKILL_ID, USER_SKILL_ID] }).errors,
    ).toEqual(['ids.arrayUnique']);
  });

  it('rejects a user id that is not a UUID', () => {
    expect(check(DeleteUserSkillsArgs, { userId: '42', ids: [USER_SKILL_ID] }).errors).toEqual([
      'userId.isUuid',
    ]);
  });
});
