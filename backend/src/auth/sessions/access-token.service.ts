import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export interface AccessTokenPayload {
  sub: string;
  sid: string;
}

@Injectable()
export class AccessTokenService {
  constructor(private readonly jwt: JwtService) {}

  sign(userId: string, sessionId: string): Promise<string> {
    return this.jwt.signAsync({ sub: userId, sid: sessionId } satisfies AccessTokenPayload);
  }

  async verify(token: string): Promise<AccessTokenPayload | null> {
    try {
      const payload = await this.jwt.verifyAsync<Partial<AccessTokenPayload>>(token);

      return typeof payload.sub === 'string' && typeof payload.sid === 'string'
        ? { sub: payload.sub, sid: payload.sid }
        : null;
    } catch {
      return null;
    }
  }
}
