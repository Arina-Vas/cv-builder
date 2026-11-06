import { describe, expect, it, vi } from 'vitest';
import { apiErrors } from './api-errors';
import type { AppError } from './graphql-errors';

const appError = (code: AppError['code']): AppError => ({ code, message: '', fieldErrors: {} });

// The module keeps its state between tests: every test unsubscribes and leaves no queued errors.
describe('apiErrors', () => {
  it('passes a reported error to the subscriber as is', () => {
    const listener = vi.fn();
    const unsubscribe = apiErrors.subscribe(listener);

    const error = appError('ENTITY_IN_USE');
    apiErrors.report(error);
    unsubscribe();

    expect(listener).toHaveBeenCalledExactlyOnceWith(error);
  });

  it('stops calling the subscriber after unsubscribe', () => {
    const listener = vi.fn();
    const unsubscribe = apiErrors.subscribe(listener);
    unsubscribe();

    const keeper = vi.fn();
    const unsubscribeKeeper = apiErrors.subscribe(keeper); // so the error is not queued
    apiErrors.report(appError('FORBIDDEN'));
    unsubscribeKeeper();

    expect(listener).not.toHaveBeenCalled();
  });

  it('keeps errors reported before anyone subscribes and delivers them in order', () => {
    apiErrors.report(appError('FORBIDDEN'));
    apiErrors.report(appError('NOT_FOUND'));

    const listener = vi.fn();
    const unsubscribe = apiErrors.subscribe(listener);
    unsubscribe();

    expect(listener.mock.calls.map(([error]) => (error as AppError).code)).toEqual([
      'FORBIDDEN',
      'NOT_FOUND',
    ]);
  });

  it('keeps only the last three queued errors', () => {
    (['FORBIDDEN', 'NOT_FOUND', 'ENTITY_IN_USE', 'RATE_LIMITED'] as const).forEach((code) =>
      apiErrors.report(appError(code)),
    );

    const listener = vi.fn();
    const unsubscribe = apiErrors.subscribe(listener);
    unsubscribe();

    expect(listener.mock.calls.map(([error]) => (error as AppError).code)).toEqual([
      'NOT_FOUND',
      'ENTITY_IN_USE',
      'RATE_LIMITED',
    ]);
  });

  it('delivers the queue once: the next subscriber does not get it again', () => {
    apiErrors.report(appError('FORBIDDEN'));

    const first = vi.fn();
    apiErrors.subscribe(first)();
    const second = vi.fn();
    apiErrors.subscribe(second)();

    expect(first).toHaveBeenCalledOnce();
    expect(second).not.toHaveBeenCalled();
  });

  it('keeps nothing on the server, so one user never sees errors of another request', () => {
    vi.stubGlobal('window', undefined);
    try {
      apiErrors.report(appError('FORBIDDEN'));
    } finally {
      vi.unstubAllGlobals();
    }

    const listener = vi.fn();
    apiErrors.subscribe(listener)();

    expect(listener).not.toHaveBeenCalled();
  });
});
