import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import { graphqlUploadExpress } from 'graphql-upload-minimal';
import { GraphqlExceptionFilter } from '@/common/errors/graphql-exception.filter';
import { validationExceptionFactory } from '@/common/errors/validation-exception.factory';
import { VALIDATOR_OPTIONS } from '@/common/validation/validator-options';
import type { EnvironmentVariables } from '@/config/env.validation';
import { MAX_IMAGE_BYTES } from '@/files/image-upload';

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
  // Multipart GraphQL requests (file uploads). A hard cap that keeps big files out of memory; it is one byte
  // over the limit because the parser marks a file of exactly maxFileSize as truncated. The service reports the size.
  app.use('/graphql', graphqlUploadExpress({ maxFileSize: MAX_IMAGE_BYTES + 1, maxFiles: 1 }));
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));
  app.enableCors({ origin: config.get('FRONTEND_URL', { infer: true }), credentials: true });
};
