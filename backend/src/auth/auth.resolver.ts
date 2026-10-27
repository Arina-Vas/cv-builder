import { ConfigService } from '@nestjs/config';
import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CurrentUser } from '@/common/auth/current-user.decorator';
import { Public } from '@/common/auth/public.decorator';
import type { GqlContext } from '@/common/graphql/graphql.context';
import { Environment, type EnvironmentVariables } from '@/config/env.validation';
import { User } from '@/users/models/user.model';
import {
  type AuthCookieSettings,
  clearAuthCookies,
  readCookie,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from './auth-cookies';
import { AuthService } from './auth.service';
import { SignInInput, SignUpInput } from './dto/credentials.input';

@Resolver()
export class AuthResolver {
  constructor(
    private readonly auth: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Mutation(() => User)
  async signUp(
    @Args('input') input: SignUpInput,
    @Context() { req, res }: GqlContext,
  ): Promise<User> {
    const { user, tokens } = await this.auth.signUp(input, req.headers['user-agent']);
    setAuthCookies(res, tokens, this.cookieSettings());
    return user;
  }

  @Public()
  @Mutation(() => User)
  async signIn(
    @Args('input') input: SignInInput,
    @Context() { req, res }: GqlContext,
  ): Promise<User> {
    const { user, tokens } = await this.auth.signIn(input, req.headers['user-agent']);
    setAuthCookies(res, tokens, this.cookieSettings());
    return user;
  }

  @Public()
  @Mutation(() => Boolean)
  async refresh(@Context() { req, res }: GqlContext): Promise<boolean> {
    try {
      const tokens = await this.auth.refresh(readCookie(req, REFRESH_TOKEN_COOKIE));
      setAuthCookies(res, tokens, this.cookieSettings());
      return true;
    } catch (error) {
      clearAuthCookies(res, this.cookieSettings());
      throw error;
    }
  }

  @Public()
  @Mutation(() => Boolean)
  async logout(@Context() { req, res }: GqlContext): Promise<boolean> {
    await this.auth.logout(readCookie(req, REFRESH_TOKEN_COOKIE));
    clearAuthCookies(res, this.cookieSettings());
    return true;
  }

  @Query(() => User)
  me(@CurrentUser() user: User): User {
    return user;
  }

  private cookieSettings(): AuthCookieSettings {
    return {
      secure: this.config.get('NODE_ENV', { infer: true }) === Environment.Production,
      accessTtlSeconds: this.config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }),
      refreshTtlDays: this.config.get('REFRESH_TTL_DAYS', { infer: true }),
    };
  }
}
