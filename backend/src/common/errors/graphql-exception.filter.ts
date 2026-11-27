import { Catch, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { GqlExceptionFilter } from '@nestjs/graphql';
import { GraphQLError } from 'graphql';
import { Prisma } from '@/generated/prisma/client';
import {
  badUserInput,
  entityInUse,
  forbidden,
  internalError,
  notFound,
  rateLimited,
  unauthenticated,
} from './app-errors';
import { ErrorCode } from './error-code.enum';

@Catch()
export class GraphqlExceptionFilter implements GqlExceptionFilter {
  private readonly logger = new Logger(GraphqlExceptionFilter.name);

  catch(exception: unknown): GraphQLError {
    if (exception instanceof GraphQLError) {
      return exception;
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.fromPrisma(exception);
    }

    if (exception instanceof HttpException) {
      return this.fromHttp(exception);
    }
    this.logUnexpected(exception);
    return internalError();
  }

  private logUnexpected(error: unknown): void {
    if (error instanceof Error && error.name.startsWith('PrismaClient')) {
      const code = 'code' in error ? ` ${String(error.code)}` : '';
      this.logger.error(`${error.name}${code}`);
      return;
    }
    this.logger.error(error);
  }

  private fromPrisma(error: Prisma.PrismaClientKnownRequestError): GraphQLError {
    switch (error.code) {
      case 'P2002':
        // Prisma reports DB columns, not input fields, so no `field` here
        return new GraphQLError('This value is already taken', {
          extensions: { code: ErrorCode.CONFLICT },
        });
      case 'P2003':
        // Services check references before create/update/delete and throw their own errors, so this is a
        // reference added to an item between the delete's check and the delete itself
        return entityInUse('This item is in use and cannot be deleted');
      case 'P2025':
        return notFound();
      default:
        this.logUnexpected(error);
        return internalError();
    }
  }

  private fromHttp(error: HttpException): GraphQLError {
    switch (error.getStatus()) {
      case HttpStatus.UNAUTHORIZED:
        return unauthenticated();
      case HttpStatus.FORBIDDEN:
        return forbidden();
      case HttpStatus.NOT_FOUND:
        return notFound(error.message);
      case HttpStatus.BAD_REQUEST:
        return badUserInput({ fields: [], message: responseMessage(error) });
      case HttpStatus.TOO_MANY_REQUESTS:
        return rateLimited(0, 'Please wait before trying again');
      default:
        this.logger.error(error);
        return internalError();
    }
  }
}

const responseMessage = (error: HttpException): string => {
  const response = error.getResponse();
  const message =
    typeof response === 'string' ? response : (response as { message?: unknown }).message;
  if (Array.isArray(message)) return message.join(', ');
  return typeof message === 'string' ? message : error.message;
};
