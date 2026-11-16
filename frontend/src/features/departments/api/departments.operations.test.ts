import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { USER_FORM_OPTIONS } from '@/features/users/api/users.operations';
import { DEPARTMENT_MUTATION_OPTIONS } from './departments.operations';

const option = (id: string) => ({ __typename: 'Department', id, name: id });
const other = { __typename: 'Position', id: 'other', name: 'other' };

describe('DEPARTMENT_MUTATION_OPTIONS', () => {
  // the user form select caches departmentOptions; without dropping it a new or deleted department
  // would not show up there until a reload
  it('drops the cached select options so the user form loads them again', () => {
    const cache = new InMemoryCache();
    cache.writeQuery({
      query: USER_FORM_OPTIONS,
      data: {
        departmentOptions: [option('a')],
        positionOptions: [other],
      },
    });

    DEPARTMENT_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: USER_FORM_OPTIONS })).toBeNull();
    expect(cache.extract().ROOT_QUERY).not.toHaveProperty('departmentOptions');
  });
});
