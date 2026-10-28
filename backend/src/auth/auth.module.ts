import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { RolesGuard } from '@/common/auth/roles.guard';
import type { EnvironmentVariables } from '@/config/env.validation';
import { MailModule } from '@/mail/mail.module';
import { UsersModule } from '@/users/users.module';
import { AccessTokenService } from './sessions/access-token.service';
import { AuthGuard } from './guards/auth.guard';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { EmailVerificationResolver } from './email-verification/email-verification.resolver';
import { EmailVerificationService } from './email-verification/email-verification.service';
import { PasswordResetResolver } from './password-reset/password-reset.resolver';
import { PasswordResetService } from './password-reset/password-reset.service';
import { SessionsService } from './sessions/sessions.service';

@Module({
  imports: [
    UsersModule,
    MailModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }) },
      }),
    }),
  ],
  providers: [
    AccessTokenService,
    SessionsService,
    AuthService,
    AuthResolver,
    EmailVerificationService,
    EmailVerificationResolver,
    PasswordResetService,
    PasswordResetResolver,
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
  exports: [AccessTokenService, SessionsService],
})
export class AuthModule {}
