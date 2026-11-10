import { useQuery } from '@apollo/client/react';
import { BREADCRUMB_USER } from '../api/breadcrumbs.operations';
import type { BreadcrumbRoute, UserOrCvName } from '../breadcrumbs';

// Name of the employee / CV in the breadcrumbs.
// TODO: the backend has no cv(id) query yet, so a CV name stays loading until it exists.
export function useUserOrCvName(route: BreadcrumbRoute | null): UserOrCvName {
  const isUser = route?.kind === 'detail' && route.section === 'users';

  const { data, loading } = useQuery(BREADCRUMB_USER, {
    variables: { id: isUser ? route.id : '' },
    skip: !isUser,
  });

  if (route?.kind !== 'detail') return { loading: false };
  if (!isUser) return { loading: true };

  const user = data?.user;
  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : undefined;

  return { name, loading };
}
