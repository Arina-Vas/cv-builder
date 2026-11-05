import type { BreadcrumbRoute, UserOrCvName } from '../breadcrumbs';

// Name of the employee / CV in the breadcrumbs.
// TODO: the backend has no user(id) / cv(id) query yet. Replace the stub with useQuery
// (cache-first, `skip` when the route is not a detail page) once it exists.
export function useUserOrCvName(route: BreadcrumbRoute | null): UserOrCvName {
  return { name: undefined, loading: route?.kind === 'detail' };
}
