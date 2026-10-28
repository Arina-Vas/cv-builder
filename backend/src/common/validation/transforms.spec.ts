import { plainToInstance } from 'class-transformer';
import { NormalizeText, ToUpperCaseText, TrimText } from './transforms';

class TextDto {
  @NormalizeText()
  name!: unknown;

  @TrimText()
  description!: unknown;

  @NormalizeText()
  @ToUpperCaseText()
  iso!: unknown;
}

const toDto = (plain: Partial<Record<keyof TextDto, unknown>>): TextDto =>
  plainToInstance(TextDto, plain);

describe('NormalizeText', () => {
  it.each([
    ['  Big   Data ', 'Big Data'],
    ['Big\t\nData', 'Big Data'],
    ['Big Data', 'Big Data'],
    ['   ', ''],
  ])('normalizes %p to %p', (input, expected) => {
    expect(toDto({ name: input }).name).toBe(expected);
  });

  it.each([42, null])('leaves %p for the validators', (value) => {
    expect(toDto({ name: value }).name).toBe(value);
  });
});

describe('TrimText', () => {
  it('trims the ends and keeps inner whitespace and line breaks', () => {
    expect(toDto({ description: '  line  1\nline 2  ' }).description).toBe('line  1\nline 2');
  });
});

describe('ToUpperCaseText', () => {
  it('upper-cases together with NormalizeText', () => {
    expect(toDto({ iso: ' en ' }).iso).toBe('EN');
  });
});
