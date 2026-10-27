import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './config/env.validation';
import { validationExceptionFactory } from '@/common/errors/validation-exception.factory';
import { GraphqlExceptionFilter } from '@/common/errors/graphql-exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, exceptionFactory: validationExceptionFactory }),
  );

  app.useGlobalFilters(new GraphqlExceptionFilter());
  app.use(cookieParser());
  app.enableCors({ origin: config.get('FRONTEND_URL', { infer: true }), credentials: true });

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
