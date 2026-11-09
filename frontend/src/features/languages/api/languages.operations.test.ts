import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { LANGUAGE_MUTATION_OPTIONS, LANGUAGES } from './languages.operations';

const variables = (page: number) =>
  ({ page, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' }) as const;

const writePage = (cache: InMemoryCache, page: number, id: string) => {
  // generated types have no __typename, but the cache needs it to normalize the row
  const item = { __typename: 'Language', id, name: id, iso: id, nativeName: id };
  cache.writeQuery({
    query: LANGUAGES,
    variables: variables(page),
    data: {
      languages: {
        items: [item],
        page,
        pageSize: 10,
        total: 11,
      },
    },
  });
};

describe('LANGUAGE_MUTATION_OPTIONS', () => {
  // refetchQueries reloads only the page on screen; other cached pages would show stale rows
  it('drops every cached page of the list, not only the one on screen', () => {
    const cache = new InMemoryCache();
    writePage(cache, 1, 'EN');
    writePage(cache, 2, 'PL');

    LANGUAGE_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: LANGUAGES, variables: variables(1) })).toBeNull();
    expect(cache.readQuery({ query: LANGUAGES, variables: variables(2) })).toBeNull();
    // rows nobody points at any more are garbage-collected too
    expect(cache.extract()).not.toHaveProperty('Language:PL');
  });

  it('still refetches the list on screen and waits for it', () => {
    expect(LANGUAGE_MUTATION_OPTIONS.refetchQueries).toEqual([LANGUAGES]);
    expect(LANGUAGE_MUTATION_OPTIONS.awaitRefetchQueries).toBe(true);
  });
});
