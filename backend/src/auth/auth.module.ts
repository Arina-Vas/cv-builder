import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { EnvironmentVariables } from '@/config/env.validation';
import { UsersModule } from '@/users/users.module';
import { AccessTokenService } from './access-token.service';
import { SessionsService } from './sessions.service';

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        secret: config.get('JWT_ACCESS_SECRET', { infer: true }),
        signOptions: { expiresIn: config.get('JWT_ACCESS_TTL_SECONDS', { infer: true }) },
      }),
    }),
  ],
  providers: [AccessTokenService, SessionsService],
  exports: [AccessTokenService, SessionsService],
})
export class AuthModule {}
