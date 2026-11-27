import type { Prisma, PrismaClient } from '@/generated/prisma/client';
import { isPrismaError } from './prisma-errors';

export interface SerializableOptions {
  /** Total tries, the first one included. */
  attempts?: number;
  /** Delay before the first retry; doubles on each next one, plus up to the same amount of jitter. */
  baseDelayMs?: number;
}

const DEFAULT_ATTEMPTS = 3;
const DEFAULT_BASE_DELAY_MS = 20;

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Runs `fn` in a Serializable interactive transaction and retries it when Postgres aborts it with a
 * serialization failure (Prisma `P2034`). `fn` may run several times, so it must not have side effects
 * outside `tx`. Any other error, and `P2034` after the last attempt, is rethrown.
 */
export async function runSerializable<T>(
  prisma: Pick<PrismaClient, '$transaction'>,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
  { attempts = DEFAULT_ATTEMPTS, baseDelayMs = DEFAULT_BASE_DELAY_MS }: SerializableOptions = {},
): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await prisma.$transaction(fn, { isolationLevel: 'Serializable' });
    } catch (error) {
      if (!isPrismaError(error, 'P2034') || attempt >= attempts) {
        throw error;
      }
      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay + Math.random() * delay);
    }
  }
}
