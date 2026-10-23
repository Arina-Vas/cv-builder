import { type RefObject, useEffect, useRef } from 'react';

interface Options {
  key: string | number | undefined;
  rows: unknown[];
  error: string | undefined;
  isBusy: boolean;
}

// Scrolls the table back to its first row after the user changes the page.
// Waits until the response comes (new rows or a new error), so it does not jump while loading;
// does nothing on the first render or when the rows change for another reason (refetch, delete)
export function useScrollResetOnData(
  targetRef: RefObject<HTMLElement | null>,
  { key, rows, error, isBusy }: Options,
) {
  const prevKeyRef = useRef(key);
  const prevRowsRef = useRef(rows);
  const prevErrorRef = useRef(error);
  const isPendingRef = useRef(false);

  useEffect(() => {
    if (prevKeyRef.current !== key) {
      prevKeyRef.current = key;
      isPendingRef.current = true;
    }

    const rowsChanged = prevRowsRef.current !== rows;
    const errorAppeared = !!error && prevErrorRef.current !== error;
    prevRowsRef.current = rows;
    prevErrorRef.current = error;

    if (!isPendingRef.current || isBusy || !(rowsChanged || errorAppeared)) return;
    isPendingRef.current = false;

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    targetRef.current?.scrollIntoView({
      block: 'start',
      behavior: reduceMotion ? 'auto' : 'smooth',
    });
  }, [targetRef, key, rows, error, isBusy]);
}
