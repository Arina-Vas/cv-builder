import { InMemoryCache } from '@apollo/client';
import { describe, expect, it } from 'vitest';
import {
  AVAILABLE_CV_PROJECTS,
  CV_PROJECT_MUTATION_OPTIONS,
  CV_PROJECT_REFETCH_ERROR_CODES,
  CV_PROJECT_REFETCH_QUERIES,
  CV_PROJECTS,
} from './cvProjects.operations';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';

// generated types have no __typename, but the cache needs it to normalize the rows
const project = (id: string) => ({
  __typename: 'Project' as const,
  id,
  name: id,
  description: '',
  domain: 'Web',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  technologies: [],
});

const listVariables = (sortBy: 'name' | 'startDate') =>
  ({ cvId: 'cv1', search: '', sortBy, sortOrder: 'ASC' }) as const;

const writeList = (cache: InMemoryCache, sortBy: 'name' | 'startDate', id: string) => {
  // a variable, not an inline literal: the generated type has no __typename field
  const item = {
    __typename: 'CvProject',
    id,
    startDate: '2024-02-01',
    endDate: null,
    responsibilities: null,
    roles: [],
    project: project(`p-${id}`),
  };
  cache.writeQuery({
    query: CV_PROJECTS,
    variables: listVariables(sortBy),
    data: { cvProjects: { items: [item], total: 1 } },
  });
};

describe('CV_PROJECT_MUTATION_OPTIONS', () => {
  it('drops every cached variant of the CV projects list and the available projects', () => {
    const cache = new InMemoryCache();
    writeList(cache, 'name', 'cp1');
    writeList(cache, 'startDate', 'cp2');
    cache.writeQuery({
      query: AVAILABLE_CV_PROJECTS,
      variables: { cvId: 'cv1' },
      data: { availableCvProjects: [project('p3')] },
    });

    CV_PROJECT_MUTATION_OPTIONS.update(cache);

    expect(cache.readQuery({ query: CV_PROJECTS, variables: listVariables('name') })).toBeNull();
    expect(
      cache.readQuery({ query: CV_PROJECTS, variables: listVariables('startDate') }),
    ).toBeNull();
    // after adding a project it must disappear from the Add project options
    expect(
      cache.readQuery({ query: AVAILABLE_CV_PROJECTS, variables: { cvId: 'cv1' } }),
    ).toBeNull();
    expect(cache.extract()).not.toHaveProperty('CvProject:cp2');
  });

  it('refetches the list on screen and waits for it before the modal closes', () => {
    expect(CV_PROJECT_MUTATION_OPTIONS.refetchQueries).toEqual([CV_PROJECTS]);
    expect(CV_PROJECT_MUTATION_OPTIONS.awaitRefetchQueries).toBe(true);
  });

  it('shows the errors in the form, not in the global toast', () => {
    expect(CV_PROJECT_MUTATION_OPTIONS.context).toBe(NO_ERROR_TOAST);
  });
});

describe('refetch on error', () => {
  it('reloads the list and the options when the data on screen is stale', () => {
    expect(CV_PROJECT_REFETCH_QUERIES).toEqual([CV_PROJECTS, AVAILABLE_CV_PROJECTS]);
    expect(CV_PROJECT_REFETCH_ERROR_CODES).toEqual(['CONFLICT', 'NOT_FOUND']);
  });
});
