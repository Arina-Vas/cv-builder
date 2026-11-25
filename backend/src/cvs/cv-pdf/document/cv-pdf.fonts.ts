import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Roboto for the CV PDF: the latin and cyrillic files and unicode ranges of `frontend/src/app/layout.tsx`,
 * plus latin-ext for Polish and other Latin Extended letters. Variable fonts from Google Fonts, one file
 * per subset with Google's unicode-range. They are embedded as data URLs: the page loads nothing from the
 * network, and a server without system fonts still renders the text of every UI language.
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
    // Polish ą ę ł ń ś ź ż and other Latin Extended letters; not in the frontend (yet)
    file: 'roboto-latin-ext.woff2',
    unicodeRange:
      'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C4, U+2113, U+2C60-2C7F, U+A720-A7FF',
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
