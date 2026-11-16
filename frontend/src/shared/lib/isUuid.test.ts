import { describe, expect, it } from 'vitest';
import { isUuid } from './isUuid';

describe('isUuid', () => {
  it('accepts a UUID in any case', () => {
    expect(isUuid('3f2b8c1e-9d4a-4e6b-8a7c-1d2e3f4a5b6c')).toBe(true);
    expect(isUuid('3F2B8C1E-9D4A-4E6B-8A7C-1D2E3F4A5B6C')).toBe(true);
  });

  it('accepts any version, like the backend ParseUUIDPipe', () => {
    expect(isUuid('00000000-0000-0000-0000-000000000000')).toBe(true);
    expect(isUuid('017f22e2-79b0-7cc3-98c4-dc0c0c07398f')).toBe(true);
  });

  it('rejects anything that is not a UUID', () => {
    expect(isUuid('')).toBe(false);
    expect(isUuid('abc')).toBe(false);
    expect(isUuid('3f2b8c1e9d4a4e6b8a7c1d2e3f4a5b6c')).toBe(false);
    expect(isUuid('3f2b8c1e-9d4a-4e6b-8a7c-1d2e3f4a5b6')).toBe(false);
    expect(isUuid('3f2b8c1e-9d4a-4e6b-8a7c-1d2e3f4a5b6cd')).toBe(false);
    expect(isUuid('gf2b8c1e-9d4a-4e6b-8a7c-1d2e3f4a5b6c')).toBe(false);
    expect(isUuid(' 3f2b8c1e-9d4a-4e6b-8a7c-1d2e3f4a5b6c ')).toBe(false);
  });
});
