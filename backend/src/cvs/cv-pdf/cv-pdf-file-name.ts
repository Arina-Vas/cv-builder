const MAX_LENGTH = 100;
const FALLBACK = 'cv';

/** Anything that is not a letter (any alphabet) or a digit separates words */
const SEPARATORS = /[^\p{L}\p{N}]+/u;

/**
 * File name of the CV PDF: the CV name in kebab-case with ".pdf", as in the wiki example
 * "Software Engineer with 5 years of experience" → "software-engineer-with-5-years-of-experience.pdf".
 */
export const toPdfFileName = (name: string): string => {
  const words = name.normalize('NFC').toLowerCase().split(SEPARATORS).filter(Boolean);

  const kebabCase = words.join('-').slice(0, MAX_LENGTH).replace(/-+$/, '');

  return `${kebabCase || FALLBACK}.pdf`;
};
