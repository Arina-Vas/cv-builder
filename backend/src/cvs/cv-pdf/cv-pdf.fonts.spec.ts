import { getCvPdfFontFaces } from './cv-pdf.fonts';

/** The `@font-face` blocks with their embedded file and unicode range */
const parseFaces = (css: string) =>
  [...css.matchAll(/base64,([^)]+)\)[\s\S]*?unicode-range: ([^;]+);/g)].map(
    ([, base64 = '', range = '']) => ({
      file: Buffer.from(base64, 'base64'),
      range,
    }),
  );

describe('getCvPdfFontFaces', () => {
  it('embeds Roboto latin, latin-ext and cyrillic as woff2 data URLs', () => {
    const faces = parseFaces(getCvPdfFontFaces());

    expect(faces).toHaveLength(3);
    for (const { file } of faces) {
      expect(file.subarray(0, 4).toString('latin1')).toBe('wOF2');
    }
  });

  it.each([
    ['latin', 'U+0000-00FF'],
    ['Polish letters (latin-ext)', 'U+0100-02BA'],
    ['cyrillic', 'U+0400-045F'],
  ])('has a face for %s', (_, range) => {
    const ranges = parseFaces(getCvPdfFontFaces()).map((face) => face.range);

    expect(ranges.some((value) => value.split(', ').includes(range))).toBe(true);
  });

  it('declares the weights the document uses, from light to semibold', () => {
    expect(getCvPdfFontFaces().match(/font-weight: 300 600;/g)).toHaveLength(3);
  });
});
