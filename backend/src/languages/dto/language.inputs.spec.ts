import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { MAX_NAME_LENGTH } from '@/common/graphql/constants';
import { CreateLanguageInput } from '@/languages/dto/create-language.input';
import { LanguagesArgs } from '@/languages/dto/languages.args';
import { UpdateLanguageInput } from '@/languages/dto/update-language.input';
import { MAX_ISO_LENGTH } from '@/languages/language.constants';
import { LanguageSortField } from '@/languages/models/language-sort-field.enum';

const VALID_ID = '3f2b8c1e-4d5a-4b6c-9e7f-0a1b2c3d4e5f';

// A valid input; each test overrides only the field it checks
const VALID_LANGUAGE = { name: 'English', iso: 'EN', nativeName: 'English' };

// Same steps as the global ValidationPipe: transform, then validate
const check = <T extends object>(cls: new () => T, plain: object) => {
  const dto = plainToInstance(cls, plain);
  const errors = validateSync(dto).flatMap((error) =>
    Object.keys(error.constraints ?? {}).map((rule) => `${error.property}.${rule}`),
  );
  return { dto, errors };
};

describe('CreateLanguageInput', () => {
  it('accepts a valid language', () => {
    expect(check(CreateLanguageInput, VALID_LANGUAGE).errors).toEqual([]);
  });

  it('normalizes the name and the native name', () => {
    const { dto, errors } = check(CreateLanguageInput, {
      ...VALID_LANGUAGE,
      name: '  Brazilian   Portuguese ',
      nativeName: ' Português   brasileiro ',
    });

    expect(dto.name).toBe('Brazilian Portuguese');
    expect(dto.nativeName).toBe('Português brasileiro');
    expect(errors).toEqual([]);
  });

  it('trims and upper-cases the ISO code', () => {
    const { dto, errors } = check(CreateLanguageInput, { ...VALID_LANGUAGE, iso: ' pt-br ' });

    expect(dto.iso).toBe('PT-BR');
    expect(errors).toEqual([]);
  });

  // A blank ISO code also fails the format check, so only the required error is asserted
  it.each(['name', 'iso', 'nativeName'])('rejects a blank %s as required', (field) => {
    expect(check(CreateLanguageInput, { ...VALID_LANGUAGE, [field]: '   ' }).errors).toContain(
      `${field}.isNotEmpty`,
    );
  });

  it.each(['name', 'nativeName'])('accepts a %s of the maximum length', (field) => {
    const plain = { ...VALID_LANGUAGE, [field]: 'a'.repeat(MAX_NAME_LENGTH) };

    expect(check(CreateLanguageInput, plain).errors).toEqual([]);
  });

  it.each(['name', 'nativeName'])('rejects a %s longer than the maximum length', (field) => {
    const plain = { ...VALID_LANGUAGE, [field]: 'a'.repeat(MAX_NAME_LENGTH + 1) };

    expect(check(CreateLanguageInput, plain).errors).toEqual([`${field}.maxLength`]);
  });

  it.each(['EN', 'ENG', 'PT-BR'])('accepts %p as an ISO code', (iso) => {
    expect(check(CreateLanguageInput, { ...VALID_LANGUAGE, iso }).errors).toEqual([]);
  });

  // Any code longer than MAX_ISO_LENGTH also fails the format check
  it('rejects an ISO code longer than the maximum length', () => {
    const plain = { ...VALID_LANGUAGE, iso: 'A'.repeat(MAX_ISO_LENGTH + 1) };

    expect(check(CreateLanguageInput, plain).errors).toContain('iso.maxLength');
  });

  it.each(['E', 'E1', 'EN_GB', 'EN-'])('rejects %p as an ISO code', (iso) => {
    expect(check(CreateLanguageInput, { ...VALID_LANGUAGE, iso }).errors).toEqual(['iso.matches']);
  });
});

describe('UpdateLanguageInput', () => {
  it('inherits the normalization rules', () => {
    const { dto, errors } = check(UpdateLanguageInput, {
      ...VALID_LANGUAGE,
      id: VALID_ID,
      name: ' Brazilian   Portuguese ',
      iso: ' pt-br ',
    });

    expect(dto.name).toBe('Brazilian Portuguese');
    expect(dto.iso).toBe('PT-BR');
    expect(errors).toEqual([]);
  });

  it('inherits the validation rules', () => {
    expect(
      check(UpdateLanguageInput, { ...VALID_LANGUAGE, id: VALID_ID, nativeName: '   ' }).errors,
    ).toEqual(['nativeName.isNotEmpty']);
  });

  it('rejects an id that is not a UUID', () => {
    expect(check(UpdateLanguageInput, { ...VALID_LANGUAGE, id: '42' }).errors).toEqual([
      'id.isUuid',
    ]);
  });
});

describe('LanguagesArgs', () => {
  it('sorts by name by default', () => {
    const { dto, errors } = check(LanguagesArgs, {});

    expect(dto.sortBy).toBe(LanguageSortField.name);
    expect(errors).toEqual([]);
  });

  it('accepts sorting by ISO code', () => {
    const { dto, errors } = check(LanguagesArgs, { sortBy: 'iso' });

    expect(dto.sortBy).toBe(LanguageSortField.iso);
    expect(errors).toEqual([]);
  });

  it('rejects an unknown sort field', () => {
    expect(check(LanguagesArgs, { sortBy: 'nativeName' }).errors).toEqual(['sortBy.isEnum']);
  });

  it('keeps the inherited pagination rules', () => {
    expect(check(LanguagesArgs, { pageSize: 15 }).errors).toEqual(['pageSize.isIn']);
  });

  it('treats a blank search as no filter', () => {
    expect(check(LanguagesArgs, { search: '   ' }).dto.search).toBeUndefined();
  });
});
