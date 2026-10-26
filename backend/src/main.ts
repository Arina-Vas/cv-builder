import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from './config/env.validation';
import { validationExceptionFactory } from '@/common/errors/validation-exception.factory';
import { GraphqlExceptionFilter } from '@/common/errors/graphql-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<EnvironmentVariables, true>>(ConfigService);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, exceptionFactory: validationExceptionFactory }),
  );

  app.useGlobalFilters(new GraphqlExceptionFilter());

  await app.listen(config.get('PORT', { infer: true }));
}

void bootstrap();
