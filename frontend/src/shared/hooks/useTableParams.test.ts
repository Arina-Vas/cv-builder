import { renderHook } from '@testing-library/react';
import { usePathname, useSearchParams } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { mockRouter } from '@/test/next-navigation';
import { type TableParamsOptions, useTableParams } from './useTableParams';

type SortField = 'name' | 'createdAt';

const OPTIONS: TableParamsOptions<SortField> = {
  sortFields: ['name', 'createdAt'],
  defaultSort: { field: 'name', order: 'ASC' },
};

// The setup file resets every mock after each test, so each test sets its own URL
function renderAt(query = '', options: TableParamsOptions<SortField> = OPTIONS) {
  vi.mocked(usePathname).mockReturnValue('/departments');
  vi.mocked(useSearchParams).mockReturnValue(
    new URLSearchParams(query) as ReturnType<typeof useSearchParams>,
  );

  return renderHook(() => useTableParams(options)).result.current;
}

// A new history entry: browser Back returns to the previous table state
function expectPushed(url: string) {
  expect(mockRouter.push).toHaveBeenCalledOnce();
  expect(mockRouter.push).toHaveBeenCalledWith(url, { scroll: false });
  expect(mockRouter.replace).not.toHaveBeenCalled();
}

// The current history entry is overwritten: typing does not pile up Back steps
function expectReplaced(url: string) {
  expect(mockRouter.replace).toHaveBeenCalledOnce();
  expect(mockRouter.replace).toHaveBeenCalledWith(url, { scroll: false });
  expect(mockRouter.push).not.toHaveBeenCalled();
}

describe('useTableParams', () => {
  describe('reading the URL', () => {
    it('returns the defaults when the URL has no params', () => {
      const params = renderAt();

      expect(params.search).toBe('');
      expect(params.sort).toEqual({ field: 'name', order: 'ASC' });
      expect(params.page).toBe(1);
      expect(params.pageSize).toBe(10);
    });

    it('uses the page default page size when given', () => {
      expect(renderAt('', { ...OPTIONS, defaultPageSize: 20 }).pageSize).toBe(20);
    });

    it('reads valid values from the URL', () => {
      const params = renderAt('search=dev&sortBy=createdAt&sortOrder=DESC&page=3&pageSize=50');

      expect(params.search).toBe('dev');
      expect(params.sort).toEqual({ field: 'createdAt', order: 'DESC' });
      expect(params.page).toBe(3);
      expect(params.pageSize).toBe(50);
    });

    it.each(['abc', '0', '-2', '2.5', ''])('falls back to page 1 for page=%j', (page) => {
      expect(renderAt(`page=${page}`).page).toBe(1);
    });

    it.each(['1000', '15', 'abc'])(
      'falls back to the default page size for pageSize=%j',
      (size) => {
        expect(renderAt(`pageSize=${size}`).pageSize).toBe(10);
      },
    );

    it('ignores a sort field the page does not allow', () => {
      expect(renderAt('sortBy=password&sortOrder=DESC').sort).toEqual({
        field: 'name',
        order: 'ASC',
      });
    });

    it.each(['asc', 'up'])(
      'keeps an allowed field but uses the default order for sortOrder=%j',
      (order) => {
        expect(renderAt(`sortBy=createdAt&sortOrder=${order}`).sort).toEqual({
          field: 'createdAt',
          order: 'ASC',
        });
      },
    );

    it('uses the default order when sortOrder is missing', () => {
      const params = renderAt('sortBy=createdAt', {
        ...OPTIONS,
        defaultSort: { field: 'name', order: 'DESC' },
      });

      expect(params.sort).toEqual({ field: 'createdAt', order: 'DESC' });
    });
  });

  describe('writing the URL', () => {
    it('setSearch replaces the URL with the search and resets the page', () => {
      renderAt('page=3&sortBy=name').setSearch('dev');

      expectReplaced('/departments?sortBy=name&search=dev');
    });

    it('setSearch with an empty string removes the search', () => {
      renderAt('search=dev&page=2').setSearch('');

      expectReplaced('/departments');
    });

    it('setSort writes field and order and resets the page', () => {
      renderAt('search=dev&page=2').setSort({ field: 'createdAt', order: 'DESC' });

      expectPushed('/departments?search=dev&sortBy=createdAt&sortOrder=DESC');
    });

    it('setPage writes the page and keeps the other params', () => {
      renderAt('search=dev').setPage(3);

      expectPushed('/departments?search=dev&page=3');
    });

    it('setPage(1) removes the page from the URL', () => {
      renderAt('search=dev&page=3').setPage(1);

      expectPushed('/departments?search=dev');
    });

    it('setPageSize writes the size and resets the page', () => {
      renderAt('page=4').setPageSize(20);

      expectPushed('/departments?pageSize=20');
    });
  });
});
