import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { CV_MUTATION_OPTIONS, CVS, USER_CVS } from './cvs.operations';

const listVariables = (page: number) =>
  ({ page, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' }) as const;

const userListVariables = (page: number) => ({ ...listVariables(page), userId: 'u1' }) as const;

// generated types have no __typename, but the cache needs it to normalize the row
const cvItem = (id: string) => ({
  __typename: 'Cv',
  id,
  name: id,
  education: 'Computer Systems Design',
  description: '',
  user: { __typename: 'User', id: 'u1', email: 'u1@example.com' },
});

const page = (id: string, pageNumber: number) => ({
  __typename: 'CvPage',
  items: [cvItem(id)],
  page: pageNumber,
  pageSize: 10,
  total: 11,
});

describe('CV_MUTATION_OPTIONS', () => {
  // every page / sort / search of both lists is cached on its own and would show stale rows
  it('drops every cached variant of the CVs and User CVs lists, not only the one on screen', () => {
    const cache = new InMemoryCache();
    cache.writeQuery({ query: CVS, variables: listVariables(1), data: { cvs: page('c1', 1) } });
    cache.writeQuery({ query: CVS, variables: listVariables(2), data: { cvs: page('c2', 2) } });
    cache.writeQuery({
      query: USER_CVS,
      variables: userListVariables(1),
      data: { userCvs: page('c3', 1) },
    });

    CV_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: CVS, variables: listVariables(1) })).toBeNull();
    expect(cache.readQuery({ query: CVS, variables: listVariables(2) })).toBeNull();
    expect(cache.readQuery({ query: USER_CVS, variables: userListVariables(1) })).toBeNull();
    expect(cache.extract()).not.toHaveProperty('Cv:c2');
  });

  it('still refetches the list on screen and waits for it', () => {
    expect(CV_MUTATION_OPTIONS.refetchQueries).toEqual([CVS, USER_CVS]);
    expect(CV_MUTATION_OPTIONS.awaitRefetchQueries).toBe(true);
  });
});
