import { GraphQLError, GraphQLScalarType, Kind } from 'graphql';
import { ErrorCode } from '@/common/errors/error-code.enum';

const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function invalidDate(message: string): GraphQLError {
  return new GraphQLError(message, { extensions: { code: ErrorCode.BAD_USER_INPUT } });
}

function parseDate(value: unknown): Date {
  if (typeof value !== 'string' || !DATE_FORMAT.test(value)) {
    throw invalidDate('Date must be a string in YYYY-MM-DD format');
  }

  // UTC midnight, the same as Prisma returns for @db.Date; the server time zone must not shift the day
  const date = new Date(`${value}T00:00:00.000Z`);

  // JS silently turns 2025-02-30 into 2025-03-02, so convert back and compare
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw invalidDate(`Invalid date: ${value}`);
  }

  return date;
}

function serializeDate(value: unknown): string {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    throw new GraphQLError('Date scalar can only serialize a valid Date');
  }
  return value.toISOString().slice(0, 10);
}

export const DateScalar = new GraphQLScalarType<Date, string>({
  name: 'Date',
  description: 'Calendar date without time and time zone, format YYYY-MM-DD',
  serialize: serializeDate,
  parseValue: parseDate,
  parseLiteral: (ast) => parseDate(ast.kind === Kind.STRING ? ast.value : undefined),
});
