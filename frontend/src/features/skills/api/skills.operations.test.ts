import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { SKILL_MUTATION_OPTIONS, SKILLS } from './skills.operations';

const variables = (page: number) =>
  ({ page, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' }) as const;

const writePage = (cache: InMemoryCache, page: number, id: string) => {
  // generated types have no __typename, but the cache needs it to normalize the row
  const category = { __typename: 'SkillCategory', id: `c-${id}`, name: id, type: id };
  const item = { __typename: 'Skill', id, name: id, category };
  cache.writeQuery({
    query: SKILLS,
    variables: variables(page),
    data: { skills: { items: [item], page, pageSize: 10, total: 11 } },
  });
};

describe('SKILL_MUTATION_OPTIONS', () => {
  // refetchQueries reloads only the page on screen; other cached pages would show stale rows
  it('drops every cached page of the list, not only the one on screen', () => {
    const cache = new InMemoryCache();
    writePage(cache, 1, 'React');
    writePage(cache, 2, 'Cypress');

    SKILL_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: SKILLS, variables: variables(1) })).toBeNull();
    expect(cache.readQuery({ query: SKILLS, variables: variables(2) })).toBeNull();
    expect(cache.extract()).not.toHaveProperty('Skill:Cypress');
  });

  it('still refetches the list on screen and waits for it', () => {
    expect(SKILL_MUTATION_OPTIONS.refetchQueries).toEqual([SKILLS]);
    expect(SKILL_MUTATION_OPTIONS.awaitRefetchQueries).toBe(true);
  });
});
