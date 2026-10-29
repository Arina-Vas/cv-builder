import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_UNVERIFIED_KEY } from '@/common/auth/allow-unverified.decorator';
import { IS_PUBLIC_KEY } from '@/common/auth/public.decorator';
import { getRequest, isMutation } from '@/common/auth/request';
import { emailNotVerified, unauthenticated } from '@/common/errors/app-errors';
import type { User } from '@/users/models/user.model';
import { UsersService } from '@/users/users.service';
import { AccessTokenService } from '../sessions/access-token.service';
import { ACCESS_TOKEN_COOKIE, readCookie } from '../sessions/auth-cookies';
import { SessionsService } from '../sessions/sessions.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly accessTokens: AccessTokenService,
    private readonly sessions: SessionsService,
    private readonly users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.hasFlag(context, IS_PUBLIC_KEY)) {
      return true;
    }

    const request = getRequest(context);
    const authenticated = await this.authenticate(readCookie(request, ACCESS_TOKEN_COOKIE));
    if (!authenticated) {
      throw unauthenticated();
    }

    request.user = authenticated.user;
    request.sessionId = authenticated.sessionId;

    if (
      authenticated.user.emailVerifiedAt === null &&
      isMutation(context) &&
      !this.hasFlag(context, ALLOW_UNVERIFIED_KEY)
    ) {
      throw emailNotVerified();
    }
    return true;
  }

  private async authenticate(
    token: string | undefined,
  ): Promise<{ user: User; sessionId: string } | null> {
    if (!token) {
      return null;
    }

    const payload = await this.accessTokens.verify(token);
    if (!payload) {
      return null;
    }

    const session = await this.sessions.findActive(payload.sid);
    if (!session || session.userId !== payload.sub) {
      return null;
    }

    const user = await this.users.findById(session.userId);
    return user ? { user, sessionId: session.id } : null;
  }

  private hasFlag(context: ExecutionContext, key: string): boolean {
    return (
      this.reflector.getAllAndOverride<boolean | undefined>(key, [
        context.getHandler(),
        context.getClass(),
      ]) === true
    );
  }
}
