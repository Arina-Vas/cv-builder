const MAX_LENGTH = 100;
const FALLBACK = 'cv';

/** Anything that is not a letter (any alphabet) or a digit separates words */
const SEPARATORS = /[^\p{L}\p{N}]+/u;

const capitalize = (word: string): string => word.charAt(0).toUpperCase() + word.slice(1);

export const toPdfFileName = (name: string): string => {
  const words = name.normalize('NFC').toLowerCase().split(SEPARATORS).filter(Boolean);

  const camelCase = words.map((word, index) => (index === 0 ? word : capitalize(word))).join('');

  return `${camelCase.slice(0, MAX_LENGTH) || FALLBACK}.pdf`;
};
