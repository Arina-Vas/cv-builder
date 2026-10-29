import { JwtService } from '@nestjs/jwt';
import { AccessTokenService } from './access-token.service';

jest.mock('@nestjs/jwt', () => ({ JwtService: class JwtService {} }));

describe('AccessTokenService', () => {
  const jwt = { signAsync: jest.fn(), verifyAsync: jest.fn() };
  const service = new AccessTokenService(jwt as unknown as JwtService);

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('signs only the user id and the session id', async () => {
    jwt.signAsync.mockResolvedValue('signed-token');

    await expect(service.sign('user-1', 'session-1')).resolves.toBe('signed-token');
    expect(jwt.signAsync).toHaveBeenCalledWith({ sub: 'user-1', sid: 'session-1' });
  });

  it('returns the payload of a valid token without extra claims', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1', sid: 'session-1', iat: 1, exp: 2 });

    await expect(service.verify('token')).resolves.toEqual({ sub: 'user-1', sid: 'session-1' });
  });

  it('returns null for an invalid or expired token', async () => {
    jwt.verifyAsync.mockRejectedValue(new Error('jwt expired'));

    await expect(service.verify('token')).resolves.toBeNull();
  });

  it('returns null when the payload has no session id', async () => {
    jwt.verifyAsync.mockResolvedValue({ sub: 'user-1' });

    await expect(service.verify('token')).resolves.toBeNull();
  });
});
