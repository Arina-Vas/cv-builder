import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

const TOKEN_BYTES = 32;
const CODE_LENGTH = 6;

export const generateToken = (): string => randomBytes(TOKEN_BYTES).toString('base64url');

export const generateVerificationCode = (): string =>
  randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0');

export const hashToken = (value: string): string =>
  createHash('sha256').update(value).digest('hex');

export const matchesHash = (value: string, hash: string): boolean => {
  const actual = Buffer.from(hashToken(value), 'hex');
  const expected = Buffer.from(hash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
};
