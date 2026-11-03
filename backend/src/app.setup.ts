import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { GraphqlExceptionFilter } from '@/common/errors/graphql-exception.filter';
import { validationExceptionFactory } from '@/common/errors/validation-exception.factory';
import { VALIDATOR_OPTIONS } from '@/common/validation/validator-options';
import type { EnvironmentVariables } from '@/config/env.validation';

export const configureApp = (app: NestExpressApplication): void => {
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      ...VALIDATOR_OPTIONS,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new GraphqlExceptionFilter());
  app.use(cookieParser());
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  app.enableCors({ origin: config.get('FRONTEND_URL', { infer: true }), credentials: true });
};
