import { describe, expect, it } from 'vitest';
import { getFullName } from './getFullName';

const EMAIL = 'thorn_pear@icloud.com';

describe('getFullName', () => {
  it('joins the first and last name', () => {
    expect(getFullName({ firstName: 'Rostislav', lastName: 'Harlanov', email: EMAIL })).toBe(
      'Rostislav Harlanov',
    );
  });

  it('uses only the part of the name that exists', () => {
    expect(getFullName({ firstName: 'Rostislav', lastName: null, email: EMAIL })).toBe('Rostislav');
    expect(getFullName({ firstName: '', lastName: 'Harlanov', email: EMAIL })).toBe('Harlanov');
  });

  it('falls back to the email when the user has no name yet', () => {
    expect(getFullName({ firstName: null, lastName: null, email: EMAIL })).toBe(EMAIL);
  });
});
