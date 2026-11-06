'use client';

import { Breadcrumbs } from '@/shared/components/breadcrumbs';
import { useBreadcrumbs } from '../../hooks/useBreadcrumbs';

export function AppBreadcrumbs() {
  const { items, label } = useBreadcrumbs();

  if (items.length === 0) return null;

  return <Breadcrumbs items={items} label={label} />;
}
