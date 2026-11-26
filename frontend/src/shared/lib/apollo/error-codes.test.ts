import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, expectTypeOf, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { ERROR_CODES, ERROR_REASONS, type ErrorCode } from './graphql-errors';

// The backend is the source of the codes (docs/api/conventions.md#codes). The frontend keeps the same list
// twice: ERROR_CODES and the errors.* texts. These checks keep all three in sync (KAN-24).
// Reasons (extensions.reason) are mirrored the same way in ERROR_REASONS; their texts live in each form.

// a path, not new URL(…, import.meta.url): under jsdom that URL is not a file: URL
const BACKEND_ERRORS_DIR = path.resolve(
  import.meta.dirname,
  '../../../../../backend/src/common/errors',
);

function readBackendEnum(file: string, name: string): string[] {
  const source = readFileSync(path.join(BACKEND_ERRORS_DIR, file), 'utf8');
  const body = new RegExp(`export enum ${name}\\s*{([^}]*)}`).exec(source)?.[1] ?? '';

  return Array.from(body.matchAll(/^\s*\w+\s*=\s*'([A-Z_]+)'/gm), (match) => match[1] ?? '');
}

const readBackendErrorCodes = () => readBackendEnum('error-code.enum.ts', 'ErrorCode');
const readBackendErrorReasons = () => readBackendEnum('error-reason.enum.ts', 'ErrorReason');

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

describe('error reasons', () => {
  it('reads the backend ErrorReason enum', () => {
    expect(readBackendErrorReasons().length).toBeGreaterThan(0);
  });

  it('lists exactly the backend reasons in ERROR_REASONS', () => {
    expect([...ERROR_REASONS].sort()).toEqual(readBackendErrorReasons().sort());
  });
});
