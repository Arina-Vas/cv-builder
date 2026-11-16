import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import { USER_FORM_OPTIONS } from '@/features/users/api/users.operations';
import { POSITION_MUTATION_OPTIONS } from './positions.operations';

const option = (id: string) => ({ __typename: 'Position', id, name: id });
const other = { __typename: 'Department', id: 'other', name: 'other' };

describe('POSITION_MUTATION_OPTIONS', () => {
  // the user form select caches positionOptions; without dropping it a new or deleted position
  // would not show up there until a reload
  it('drops the cached select options so the user form loads them again', () => {
    const cache = new InMemoryCache();
    cache.writeQuery({
      query: USER_FORM_OPTIONS,
      data: {
        positionOptions: [option('a')],
        departmentOptions: [other],
      },
    });

    POSITION_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: USER_FORM_OPTIONS })).toBeNull();
    expect(cache.extract().ROOT_QUERY).not.toHaveProperty('positionOptions');
  });
});
