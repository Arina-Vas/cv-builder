import { Prisma } from '@/generated/prisma/client';

export const isPrismaError = (
  error: unknown,
  code: 'P2002' | 'P2003' | 'P2025',
): error is Prisma.PrismaClientKnownRequestError =>
  error instanceof Prisma.PrismaClientKnownRequestError && error.code === code;
