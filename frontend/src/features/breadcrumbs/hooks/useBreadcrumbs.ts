import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import type { BreadcrumbItem } from '@/shared/components/breadcrumbs';
import { buildBreadcrumbs, parseBreadcrumbRoute } from '../breadcrumbs';
import { useUserOrCvName } from './useUserOrCvName';

export function useBreadcrumbs(): { items: BreadcrumbItem[]; label: string } {
  const pathname = usePathname();
  const t = useTranslations();

  const route = parseBreadcrumbRoute(pathname);
  const userOrCvName = useUserOrCvName(route);

  return {
    items: buildBreadcrumbs(route, (key) => t(key), userOrCvName),
    label: t('layout.breadcrumbs'),
  };
}
