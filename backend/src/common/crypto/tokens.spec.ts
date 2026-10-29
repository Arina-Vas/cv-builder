import * as nodeCrypto from 'node:crypto';
import { generateToken, generateVerificationCode, hashToken, matchesHash } from './tokens';

jest.mock('node:crypto', () => ({
  ...jest.requireActual<typeof import('node:crypto')>('node:crypto'),
  randomInt: jest.fn(),
}));

const randomInt = jest.mocked(nodeCrypto.randomInt) as unknown as jest.Mock<
  number,
  [number, number]
>;

describe('tokens', () => {
  describe('generateToken', () => {
    it('returns a URL-safe token with 32 bytes of randomness', () => {
      const token = generateToken();

      expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(Buffer.from(token, 'base64url')).toHaveLength(32);
    });

    it('returns a new value every time', () => {
      expect(generateToken()).not.toBe(generateToken());
    });
  });

  describe('generateVerificationCode', () => {
    it('draws from the full 6-digit range', () => {
      randomInt.mockReturnValue(123456);

      generateVerificationCode();

      expect(randomInt).toHaveBeenCalledWith(0, 1_000_000);
    });

    it.each([
      [123456, '123456'],
      [42, '000042'],
      [0, '000000'],
      [999999, '999999'],
    ])('turns %i into "%s"', (value, code) => {
      randomInt.mockReturnValue(value);

      expect(generateVerificationCode()).toBe(code);
    });
  });

  describe('hashToken', () => {
    it('returns the sha256 hex digest', () => {
      expect(hashToken('abc')).toBe(
        'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
      );
    });

    it('is deterministic, so a stored hash can be looked up', () => {
      expect(hashToken('token')).toBe(hashToken('token'));
    });

    it('never returns the original value', () => {
      expect(hashToken('token')).not.toContain('token');
    });
  });

  describe('matchesHash', () => {
    it('is true for the value the hash was made from', () => {
      expect(matchesHash('042917', hashToken('042917'))).toBe(true);
    });

    it('is false for another value', () => {
      expect(matchesHash('042918', hashToken('042917'))).toBe(false);
    });

    it('is false for a malformed stored hash instead of throwing', () => {
      expect(matchesHash('042917', 'not-a-hash')).toBe(false);
    });
  });
});
