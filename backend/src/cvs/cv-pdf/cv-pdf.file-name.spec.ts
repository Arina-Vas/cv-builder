import { toPdfFileName } from './cv-pdf.file-name';

describe('toPdfFileName', () => {
  it('turns the CV name into kebab-case with the .pdf extension, as in the wiki', () => {
    expect(toPdfFileName('Software Engineer with 5 years of experience')).toBe(
      'software-engineer-with-5-years-of-experience.pdf',
    );
  });

  it('lowercases every word', () => {
    expect(toPdfFileName('SENIOR API Developer')).toBe('senior-api-developer.pdf');
  });

  it('ignores extra spaces, tabs and new lines', () => {
    expect(toPdfFileName('  Frontend \t  Dev\n')).toBe('frontend-dev.pdf');
  });

  it('replaces characters not allowed in file names with one hyphen', () => {
    expect(toPdfFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('a-b-c-d-e-f-g-h-i-j.pdf');
  });

  it('replaces punctuation and symbols, without repeated or edge hyphens', () => {
    expect(toPdfFileName('-- Senior (5+ years), React! --')).toBe('senior-5-years-react.pdf');
  });

  it('keeps cyrillic and other letters without transliteration', () => {
    expect(toPdfFileName('Разработчик Ивана')).toBe('разработчик-ивана.pdf');
    expect(toPdfFileName('Programista Łódź')).toBe('programista-łódź.pdf');
  });

  it('keeps a letter with a combining accent as one letter', () => {
    expect(toPdfFileName('Café Manager')).toBe('café-manager.pdf');
  });

  it.each(['', '   ', '---', '🚀✨', '!?.'])('falls back to cv.pdf for %j', (name) => {
    expect(toPdfFileName(name)).toBe('cv.pdf');
  });

  it('cuts the name to 100 characters before the extension', () => {
    const fileName = toPdfFileName(`${'a'.repeat(60)} ${'b'.repeat(60)}`);

    expect(fileName).toBe(`${'a'.repeat(60)}-${'b'.repeat(39)}.pdf`);
    expect(fileName).toHaveLength(104);
  });

  it('does not end with a hyphen when the cut falls on a separator', () => {
    expect(toPdfFileName(`${'a'.repeat(100)} tail`)).toBe(`${'a'.repeat(100)}.pdf`);
  });
});
