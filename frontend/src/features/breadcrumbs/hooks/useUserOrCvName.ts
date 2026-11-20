import { skipToken, useQuery } from '@apollo/client/react';
import { BREADCRUMB_CV, BREADCRUMB_USER } from '../api/breadcrumbs.operations';
import type { BreadcrumbRoute, UserOrCvName } from '../breadcrumbs';

// Name of the employee / CV in the breadcrumbs.
export function useUserOrCvName(route: BreadcrumbRoute | null): UserOrCvName {
  const isUser = route?.kind === 'detail' && route.section === 'users';
  const isCvSection = route?.kind === 'detail' && route.section === 'cvs';

  const { data, loading } = useQuery(
    BREADCRUMB_USER,
    isUser
      ? {
          variables: { id: route.id },
        }
      : skipToken,
  );

  const { data: cvData, loading: cvLoading } = useQuery(
    BREADCRUMB_CV,
    isCvSection
      ? {
          variables: { id: route.id },
        }
      : skipToken,
  );

  if (route?.kind !== 'detail') return { loading: false };
  if (isCvSection) return { name: cvData?.cv.name, loading: cvLoading };

  const user = data?.user;
  const name = user
    ? [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email
    : undefined;

  return { name, loading };
}
