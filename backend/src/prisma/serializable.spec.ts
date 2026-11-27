import { Prisma } from '@/generated/prisma/client';
import { runSerializable } from './serializable';

const prismaError = (code: string): Prisma.PrismaClientKnownRequestError =>
  new Prisma.PrismaClientKnownRequestError('Transaction failed', { code, clientVersion: 'test' });

const tx = {} as Prisma.TransactionClient;

const makePrisma = () => ({
  $transaction: jest.fn((fn: (client: Prisma.TransactionClient) => Promise<unknown>) => fn(tx)),
});

describe('runSerializable', () => {
  it('runs the callback in a Serializable transaction and returns its result', async () => {
    const prisma = makePrisma();
    const fn = jest.fn().mockResolvedValue('result');

    await expect(runSerializable(prisma as never, fn)).resolves.toBe('result');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(prisma.$transaction).toHaveBeenCalledWith(fn, { isolationLevel: 'Serializable' });
    expect(fn).toHaveBeenCalledWith(tx);
  });

  it('retries after a serialization failure (P2034)', async () => {
    const prisma = makePrisma();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(prismaError('P2034'))
      .mockRejectedValueOnce(prismaError('P2034'))
      .mockResolvedValue('result');

    await expect(runSerializable(prisma as never, fn, { baseDelayMs: 0 })).resolves.toBe('result');

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('rethrows P2034 after the last attempt', async () => {
    const prisma = makePrisma();
    const error = prismaError('P2034');
    const fn = jest.fn().mockRejectedValue(error);

    await expect(
      runSerializable(prisma as never, fn, { attempts: 2, baseDelayMs: 0 }),
    ).rejects.toBe(error);

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('tries 3 times by default', async () => {
    const prisma = makePrisma();
    const fn = jest.fn().mockRejectedValue(prismaError('P2034'));

    await expect(runSerializable(prisma as never, fn, { baseDelayMs: 0 })).rejects.toThrow();

    expect(fn).toHaveBeenCalledTimes(3);
  });

  it.each([
    ['another Prisma error', prismaError('P2002')],
    ['an application error', new Error('Last admin')],
  ])('does not retry %s', async (_, error) => {
    const prisma = makePrisma();
    const fn = jest.fn().mockRejectedValue(error);

    await expect(runSerializable(prisma as never, fn, { baseDelayMs: 0 })).rejects.toBe(error);

    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('waits longer before each next retry', async () => {
    jest.useFakeTimers();
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const prisma = makePrisma();
    const fn = jest
      .fn()
      .mockRejectedValueOnce(prismaError('P2034'))
      .mockRejectedValueOnce(prismaError('P2034'))
      .mockResolvedValue('result');

    try {
      const promise = runSerializable(prisma as never, fn, { baseDelayMs: 10 });

      await jest.advanceTimersByTimeAsync(9);
      expect(fn).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledTimes(2);

      await jest.advanceTimersByTimeAsync(19);
      expect(fn).toHaveBeenCalledTimes(2);
      await jest.advanceTimersByTimeAsync(1);
      expect(fn).toHaveBeenCalledTimes(3);

      await expect(promise).resolves.toBe('result');
    } finally {
      jest.useRealTimers();
      jest.restoreAllMocks();
    }
  });
});
