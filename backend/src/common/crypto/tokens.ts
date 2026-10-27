import { createHash, randomBytes, randomInt } from 'node:crypto';

const TOKEN_BYTES = 32;
const CODE_LENGTH = 6;

export const generateToken = (): string => randomBytes(TOKEN_BYTES).toString('base64url');

export const generateVerificationCode = (): string =>
  randomInt(0, 10 ** CODE_LENGTH)
    .toString()
    .padStart(CODE_LENGTH, '0');

export const hashToken = (value: string): string =>
  createHash('sha256').update(value).digest('hex');
