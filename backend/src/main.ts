import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { validationExceptionFactory } from '@/common/errors/validation-exception.factory';
import { GraphqlExceptionFilter } from '@/common/errors/graphql-exception.filter';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, exceptionFactory: validationExceptionFactory }),
  );

  app.useGlobalFilters(new GraphqlExceptionFilter());

  await app.listen(process.env.PORT ?? 4000);
}

void bootstrap();
