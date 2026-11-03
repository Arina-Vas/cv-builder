import { hashPassword, verifyPassword } from './password';

describe('password', () => {
  it('never returns the plain password as the hash', async () => {
    const hash = await hashPassword('secret123');

    expect(hash).not.toContain('secret123');
    expect(hash.startsWith('$argon2id$')).toBe(true);
  });

  it('salts every hash, so the same password gives different hashes', async () => {
    expect(await hashPassword('secret123')).not.toBe(await hashPassword('secret123'));
  });

  it('accepts the correct password', async () => {
    const hash = await hashPassword('secret123');

    await expect(verifyPassword(hash, 'secret123')).resolves.toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('secret123');

    await expect(verifyPassword(hash, 'secret124')).resolves.toBe(false);
  });

  it('returns false instead of throwing when the stored hash is malformed', async () => {
    await expect(verifyPassword('not-a-hash', 'secret123')).resolves.toBe(false);
  });
});
