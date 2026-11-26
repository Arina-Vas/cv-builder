import { containsInsensitive, escapeLike } from './search';

describe('search', () => {
  describe('escapeLike', () => {
    it('leaves a plain search unchanged', () => {
      expect(escapeLike('John Smith')).toBe('John Smith');
    });

    it.each([
      ['%', '\\%'],
      ['_', '\\_'],
      ['\\', '\\\\'],
    ])('escapes %s so it is matched literally', (search, escaped) => {
      expect(escapeLike(search)).toBe(escaped);
    });

    it('escapes every wildcard in a mixed search', () => {
      expect(escapeLike('50%_off\\now')).toBe('50\\%\\_off\\\\now');
    });
  });

  describe('containsInsensitive', () => {
    it('builds a case-insensitive contains filter from the escaped search', () => {
      expect(containsInsensitive('a_b')).toEqual({ contains: 'a\\_b', mode: 'insensitive' });
    });
  });
});
