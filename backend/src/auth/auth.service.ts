import { Injectable, Logger } from '@nestjs/common';
import { hashPassword, verifyPassword } from '@/common/crypto/password';
import { conflict, unauthenticated } from '@/common/errors/app-errors';
import { Prisma } from '@/generated/prisma/client';
import type { User } from '@/users/models/user.model';
import { UsersService } from '@/users/users.service';
import { AccessTokenService } from './access-token.service';
import type { AuthTokens } from './auth-cookies';
import type { SignInInput, SignUpInput } from './dto/credentials.input';
import { EmailVerificationService } from './email-verification.service';
import { SessionsService } from './sessions.service';

export const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists';
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

const isUniqueViolation = (error: unknown): boolean =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private dummyHash?: Promise<string>;

  constructor(
    private readonly users: UsersService,
    private readonly sessions: SessionsService,
    private readonly accessTokens: AccessTokenService,
    private readonly verification: EmailVerificationService,
  ) {}

  async signUp(input: SignUpInput, userAgent?: string): Promise<AuthResult> {
    if (await this.users.findByEmail(input.email)) {
      throw conflict('email', EMAIL_TAKEN_MESSAGE);
    }

    const passwordHash = await hashPassword(input.password);
    const user = await this.users.create({ email: input.email, passwordHash }).catch((error) => {
      throw isUniqueViolation(error) ? conflict('email', EMAIL_TAKEN_MESSAGE) : error;
    });

    // The account exists either way; the user can ask for a new code on the verification page
    await this.verification.sendCode(user.id, user.email).catch((error: unknown) => {
      this.logger.warn(`Failed to send verification email to user ${user.id}`, error);
    });

    return { user, tokens: await this.startSession(user.id, userAgent) };
  }

  async signIn(input: SignInInput, userAgent?: string): Promise<AuthResult> {
    const credentials = await this.users.findWithPasswordHashByEmail(input.email);
    const passwordMatches = await verifyPassword(
      credentials?.passwordHash ?? (await this.getDummyHash()),
      input.password,
    );
    const user = credentials && passwordMatches ? await this.users.findById(credentials.id) : null;

    if (!user) {
      throw unauthenticated(INVALID_CREDENTIALS_MESSAGE);
    }
    return { user, tokens: await this.startSession(user.id, userAgent) };
  }

  async refresh(refreshToken: string | undefined): Promise<AuthTokens> {
    const rotated = refreshToken ? await this.sessions.rotate(refreshToken) : null;
    if (!rotated) {
      throw unauthenticated();
    }

    return {
      accessToken: await this.accessTokens.sign(rotated.userId, rotated.sessionId),
      refreshToken: rotated.refreshToken,
    };
  }

  async logout(refreshToken: string | undefined): Promise<void> {
    if (refreshToken) {
      await this.sessions.revokeByRefreshToken(refreshToken);
    }
  }

  private async startSession(userId: string, userAgent?: string): Promise<AuthTokens> {
    const { sessionId, refreshToken } = await this.sessions.create(userId, userAgent);
    return { accessToken: await this.accessTokens.sign(userId, sessionId), refreshToken };
  }

  private getDummyHash(): Promise<string> {
    this.dummyHash ??= hashPassword('dummy-password-for-timing');
    return this.dummyHash;
  }
}
