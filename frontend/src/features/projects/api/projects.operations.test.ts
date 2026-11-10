import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { PROJECT_MUTATION_OPTIONS, PROJECTS } from './projects.operations';

const variables = (sortBy: 'name' | 'startDate') =>
  ({ search: '', sortBy, sortOrder: 'ASC' }) as const;

const writeList = (cache: InMemoryCache, sortBy: 'name' | 'startDate', id: string) => {
  // generated types have no __typename, but the cache needs it to normalize the row
  const item = {
    __typename: 'Project',
    id,
    name: id,
    description: '',
    domain: 'Web',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    technologies: [],
  };
  cache.writeQuery({
    query: PROJECTS,
    variables: variables(sortBy),
    data: { projects: { items: [item], total: 1 } },
  });
};

describe('PROJECT_MUTATION_OPTIONS', () => {
  // the list has no pages, but every sort / search is cached on its own and would show stale rows
  it('drops every cached variant of the list, not only the one on screen', () => {
    const cache = new InMemoryCache();
    writeList(cache, 'name', 'p1');
    writeList(cache, 'startDate', 'p2');

    PROJECT_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: PROJECTS, variables: variables('name') })).toBeNull();
    expect(cache.readQuery({ query: PROJECTS, variables: variables('startDate') })).toBeNull();
    expect(cache.extract()).not.toHaveProperty('Project:p2');
  });

  it('still refetches the list on screen and waits for it', () => {
    expect(PROJECT_MUTATION_OPTIONS.refetchQueries).toEqual([PROJECTS]);
    expect(PROJECT_MUTATION_OPTIONS.awaitRefetchQueries).toBe(true);
  });
});
