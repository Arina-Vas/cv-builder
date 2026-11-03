import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  NotImplementedException,
  UnauthorizedException,
} from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { Prisma } from '@/generated/prisma/client';
import { conflict } from './app-errors';
import { ErrorCode } from './error-code.enum';
import { GraphqlExceptionFilter } from './graphql-exception.filter';

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Invalid prisma.department.delete() invocation', {
    code,
    clientVersion: 'test',
  });

describe('GraphqlExceptionFilter', () => {
  const filter = new GraphqlExceptionFilter();
  const codeOf = (exception: unknown): unknown => filter.catch(exception).extensions['code'];

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns our own GraphQL errors unchanged', () => {
    const error = conflict('name', 'Department with this name already exists');

    expect(filter.catch(error)).toBe(error);
  });

  describe('Prisma errors', () => {
    it.each([
      ['P2002', ErrorCode.CONFLICT],
      ['P2003', ErrorCode.ENTITY_IN_USE],
      ['P2025', ErrorCode.NOT_FOUND],
    ])('maps %s to %s', (prismaCode, expected) => {
      expect(codeOf(prismaError(prismaCode))).toBe(expected);
    });

    it('does not expose the Prisma message', () => {
      const result = filter.catch(prismaError('P2002'));

      expect(result.message).not.toContain('prisma');
      expect(result.extensions['field']).toBeUndefined();
    });

    it('logs unknown Prisma codes and hides them', () => {
      const result = filter.catch(prismaError('P2034'));

      expect(result.extensions['code']).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain('prisma');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });

  describe('HTTP exceptions', () => {
    it.each([
      [new UnauthorizedException(), ErrorCode.UNAUTHENTICATED],
      [new ForbiddenException(), ErrorCode.FORBIDDEN],
      [new NotFoundException('CV not found'), ErrorCode.NOT_FOUND],
      [new BadRequestException('Validation failed (uuid is expected)'), ErrorCode.BAD_USER_INPUT],
      [
        new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS),
        ErrorCode.RATE_LIMITED,
      ],
      [new NotImplementedException(), ErrorCode.INTERNAL_SERVER_ERROR],
    ])('maps %p to %s', (exception, expected) => {
      expect(codeOf(exception)).toBe(expected);
    });

    it('keeps the message of NotFoundException', () => {
      expect(filter.catch(new NotFoundException('CV not found')).message).toBe('CV not found');
    });

    it('uses the detailed message of BadRequestException', () => {
      const exception = new BadRequestException(['id must be a UUID', 'page must be an integer']);

      expect(filter.catch(exception).message).toBe('id must be a UUID, page must be an integer');
    });

    it('replaces the default Forbidden message', () => {
      expect(filter.catch(new ForbiddenException()).message).toBe(
        'You are not authorized to perform this action',
      );
    });
  });

  describe('unknown errors', () => {
    it('hides the original message and logs the error', () => {
      const result = filter.catch(new Error("Can't reach database server at localhost:5432"));

      expect(result).toBeInstanceOf(GraphQLError);
      expect(result.extensions['code']).toBe(ErrorCode.INTERNAL_SERVER_ERROR);
      expect(result.message).not.toContain('localhost');
      expect(Logger.prototype.error).toHaveBeenCalled();
    });
  });
});
