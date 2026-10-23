import { describe, expect, it } from 'vitest';

import { getPageCount, getPageItems } from './getPageItems';

describe('getPageItems', () => {
  it('shows every page when there are 7 or fewer', () => {
    expect(getPageItems(1, 1)).toEqual([1]);
    expect(getPageItems(3, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPageItems(7, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('puts one ellipsis at the end near the first page', () => {
    expect(getPageItems(1, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
    expect(getPageItems(4, 20)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 20]);
  });

  it('puts one ellipsis at the start near the last page', () => {
    expect(getPageItems(20, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
    expect(getPageItems(17, 20)).toEqual([1, 'start-ellipsis', 16, 17, 18, 19, 20]);
  });

  it('shows the current page with its neighbours in the middle', () => {
    expect(getPageItems(5, 20)).toEqual([1, 'start-ellipsis', 4, 5, 6, 'end-ellipsis', 20]);
    expect(getPageItems(10, 20)).toEqual([1, 'start-ellipsis', 9, 10, 11, 'end-ellipsis', 20]);
    expect(getPageItems(16, 20)).toEqual([1, 'start-ellipsis', 15, 16, 17, 'end-ellipsis', 20]);
  });

  it('always returns 7 items when there are more than 7 pages', () => {
    for (let page = 1; page <= 20; page++) {
      expect(getPageItems(page, 20)).toHaveLength(7);
    }
    for (let page = 1; page <= 8; page++) {
      expect(getPageItems(page, 8)).toHaveLength(7);
    }
  });

  it('never skips a single page behind an ellipsis', () => {
    expect(getPageItems(4, 8)).toEqual([1, 2, 3, 4, 5, 'end-ellipsis', 8]);
    expect(getPageItems(5, 8)).toEqual([1, 'start-ellipsis', 4, 5, 6, 7, 8]);
  });
});

describe('getPageCount', () => {
  it('rounds up', () => {
    expect(getPageCount(200, 10)).toBe(20);
    expect(getPageCount(201, 10)).toBe(21);
    expect(getPageCount(9, 10)).toBe(1);
  });

  it('is 1 for an empty list', () => {
    expect(getPageCount(0, 10)).toBe(1);
  });
});
