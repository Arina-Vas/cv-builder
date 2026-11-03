import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { Proficiency } from '@/common/graphql/enums';
import { CreateUserLanguageInput } from '@/languages/user-languages/dto/create-user-language.input';
import { UpdateUserLanguageInput } from '@/languages/user-languages/dto/update-user-language.input';
import { DeleteUserLanguagesArgs } from '@/languages/user-languages/dto/delete-user-languages.args';

const USER_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';
const LANGUAGE_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5a';
const USER_LANGUAGE_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5b';
const OTHER_USER_LANGUAGE_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5c';

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

const VALID_CREATE = { userId: USER_ID, languageId: LANGUAGE_ID, proficiency: Proficiency.A2 };
const VALID_UPDATE = { id: USER_LANGUAGE_ID, userId: USER_ID, proficiency: Proficiency.B2 };

describe('CreateUserLanguageInput', () => {
  it('accepts a valid assignment', () => {
    expect(check(CreateUserLanguageInput, VALID_CREATE).errors).toEqual([]);
  });

  it.each(Object.values(Proficiency))('accepts %s as proficiency', (proficiency) => {
    expect(check(CreateUserLanguageInput, { ...VALID_CREATE, proficiency }).errors).toEqual([]);
  });

  it.each([undefined, '', 'english'])('rejects %p as a language id', (languageId) => {
    expect(check(CreateUserLanguageInput, { ...VALID_CREATE, languageId }).errors).toEqual([
      'languageId.isUuid',
    ]);
  });

  it.each([undefined, '', '42'])('rejects %p as a user id', (userId) => {
    expect(check(CreateUserLanguageInput, { ...VALID_CREATE, userId }).errors).toEqual([
      'userId.isUuid',
    ]);
  });

  it.each([undefined, 'A5', 'native'])('rejects %p as proficiency', (proficiency) => {
    expect(check(CreateUserLanguageInput, { ...VALID_CREATE, proficiency }).errors).toEqual([
      'proficiency.isEnum',
    ]);
  });
});

describe('UpdateUserLanguageInput', () => {
  it('accepts a valid update without a language id', () => {
    expect(check(UpdateUserLanguageInput, VALID_UPDATE).errors).toEqual([]);
  });

  it('inherits the proficiency rule', () => {
    expect(check(UpdateUserLanguageInput, { ...VALID_UPDATE, proficiency: 'A5' }).errors).toEqual([
      'proficiency.isEnum',
    ]);
  });

  it('inherits the user id rule', () => {
    expect(check(UpdateUserLanguageInput, { ...VALID_UPDATE, userId: '42' }).errors).toEqual([
      'userId.isUuid',
    ]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(check(UpdateUserLanguageInput, { ...VALID_UPDATE, id: '42' }).errors).toEqual([
      'id.isUuid',
    ]);
  });
});

describe('DeleteUserLanguagesArgs', () => {
  it('accepts several assignment ids', () => {
    const { dto, errors } = check(DeleteUserLanguagesArgs, {
      userId: USER_ID,
      ids: [USER_LANGUAGE_ID, OTHER_USER_LANGUAGE_ID],
    });

    expect(dto.ids).toEqual([USER_LANGUAGE_ID, OTHER_USER_LANGUAGE_ID]);
    expect(errors).toEqual([]);
  });

  it('rejects an empty list', () => {
    expect(check(DeleteUserLanguagesArgs, { userId: USER_ID, ids: [] }).errors).toEqual([
      'ids.arrayNotEmpty',
    ]);
  });

  it('rejects an id that is not a UUID', () => {
    expect(
      check(DeleteUserLanguagesArgs, { userId: USER_ID, ids: [USER_LANGUAGE_ID, 'x'] }).errors,
    ).toEqual(['ids.isUuid']);
  });

  it('rejects duplicate ids', () => {
    expect(
      check(DeleteUserLanguagesArgs, { userId: USER_ID, ids: [USER_LANGUAGE_ID, USER_LANGUAGE_ID] })
        .errors,
    ).toEqual(['ids.arrayUnique']);
  });

  it('rejects a user id that is not a UUID', () => {
    expect(
      check(DeleteUserLanguagesArgs, { userId: '42', ids: [USER_LANGUAGE_ID] }).errors,
    ).toEqual(['userId.isUuid']);
  });
});
