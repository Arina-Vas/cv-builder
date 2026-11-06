import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { ERROR_CODES, type ErrorCode } from './graphql-errors';

// The backend is the source of the codes (docs/api/conventions.md#codes). The frontend keeps the same list
// twice: ERROR_CODES and the errors.* texts. These checks keep all three in sync (KAN-24).

// a path, not new URL(…, import.meta.url): under jsdom that URL is not a file: URL
const BACKEND_ENUM_PATH = path.resolve(
  import.meta.dirname,
  '../../../../../backend/src/common/errors/error-code.enum.ts',
);

function readBackendErrorCodes(): string[] {
  const source = readFileSync(BACKEND_ENUM_PATH, 'utf8');
  const body = /export enum ErrorCode\s*{([^}]*)}/.exec(source)?.[1] ?? '';

  return Array.from(body.matchAll(/^\s*\w+\s*=\s*'([A-Z_]+)'/gm), (match) => match[1] ?? '');
}

describe('error codes', () => {
  it('reads the backend ErrorCode enum', () => {
    // guards the parser: an empty list would make the comparisons below meaningless
    expect(readBackendErrorCodes().length).toBeGreaterThan(0);
  });

  it('lists exactly the backend codes in ERROR_CODES', () => {
    expect([...ERROR_CODES].sort()).toEqual(readBackendErrorCodes().sort());
  });

  it('has a text in errors.* for every code and no text for an unknown code', () => {
    expect(Object.keys(messages.errors).sort()).toEqual([...ERROR_CODES].sort());
  });

  it('types ErrorCode as exactly the errors.* keys (checked by pnpm typecheck)', () => {
    expectTypeOf<ErrorCode>().toEqualTypeOf<keyof typeof messages.errors>();
  });
});
