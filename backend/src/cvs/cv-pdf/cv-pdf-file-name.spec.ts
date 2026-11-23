import { toPdfFileName } from './cv-pdf-file-name';

describe('toPdfFileName', () => {
  it('turns the CV name into camelCase with the .pdf extension', () => {
    expect(toPdfFileName('Software Engineer with 5 years of experience')).toBe(
      'softwareEngineerWith5YearsOfExperience.pdf',
    );
  });

  it('lowercases the rest of every word', () => {
    expect(toPdfFileName('SENIOR API Developer')).toBe('seniorApiDeveloper.pdf');
  });

  it('ignores extra spaces, tabs and new lines', () => {
    expect(toPdfFileName('  Frontend \t  Dev\n')).toBe('frontendDev.pdf');
  });

  it('drops characters not allowed in file names', () => {
    expect(toPdfFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('aBCDEFGHIJ.pdf');
  });

  it('drops punctuation and symbols', () => {
    expect(toPdfFileName('Senior (5+ years), React!')).toBe('senior5YearsReact.pdf');
  });

  it('keeps cyrillic and other letters without transliteration', () => {
    expect(toPdfFileName('Разработчик Ивана')).toBe('разработчикИвана.pdf');
    expect(toPdfFileName('Programista Łódź')).toBe('programistaŁódź.pdf');
  });

  it('keeps a letter with a combining accent as one letter', () => {
    expect(toPdfFileName('Café Manager')).toBe('caféManager.pdf');
  });

  it.each(['', '   ', '---', '🚀✨', '!?.'])('falls back to cv.pdf for %j', (name) => {
    expect(toPdfFileName(name)).toBe('cv.pdf');
  });

  it('cuts the name to 100 characters before the extension', () => {
    const fileName = toPdfFileName(`${'a'.repeat(60)} ${'b'.repeat(60)}`);

    expect(fileName).toBe(`${'a'.repeat(60)}B${'b'.repeat(39)}.pdf`);
    expect(fileName).toHaveLength(104);
  });
});
