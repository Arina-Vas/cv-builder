import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Roboto for the CV PDF, the same files and unicode ranges as `frontend/src/app/layout.tsx`.
 * The fonts are embedded as data URLs: the page loads nothing from the network, and a server
 * without system fonts still renders latin and cyrillic text.
 *
 * The woff2 files lie next to this module; `nest-cli.json` copies them to `dist` on build.
 */
const FONTS_DIR = join(__dirname, 'fonts');

const ROBOTO_FACES = [
  {
    file: 'roboto-latin.woff2',
    unicodeRange:
      'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD',
  },
  {
    file: 'roboto-cyrillic.woff2',
    unicodeRange: 'U+0301, U+0400-045F, U+0490-0491, U+04B0-04B1, U+2116',
  },
];

let fontFaces: string | undefined;

/** `@font-face` rules for Roboto; the files are read once, on the first PDF */
export const getCvPdfFontFaces = (): string => {
  fontFaces ??= ROBOTO_FACES.map(({ file, unicodeRange }) => {
    const base64 = readFileSync(join(FONTS_DIR, file)).toString('base64');
    return `
@font-face {
  font-family: 'Roboto';
  font-style: normal;
  font-weight: 300 600;
  src: url(data:font/woff2;base64,${base64}) format('woff2');
  unicode-range: ${unicodeRange};
}`;
  }).join('');

  return fontFaces;
};
