import type { Messages } from 'next-intl';
import type { UserRole } from '@/gql/graphql';

export type NavLabelKey = keyof Messages['nav'];

export interface NavItem {
  href: string;
  labelKey: NavLabelKey;
  adminOnly: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/users', labelKey: 'employees', adminOnly: false },
  { href: '/cvs', labelKey: 'cvs', adminOnly: false },
  { href: '/skills', labelKey: 'skills', adminOnly: false },
  { href: '/languages', labelKey: 'languages', adminOnly: false },
  { href: '/departments', labelKey: 'departments', adminOnly: true },
  { href: '/positions', labelKey: 'positions', adminOnly: true },
  { href: '/projects', labelKey: 'projects', adminOnly: true },
];

export interface NavGroups {
  main: NavItem[];
  admin: NavItem[];
}

export function getNavItems(role: UserRole | null): NavGroups {
  const main = NAV_ITEMS.filter((item) => !item.adminOnly);
  const admin = role === 'ADMIN' ? NAV_ITEMS.filter((item) => item.adminOnly) : [];

  return { main, admin };
}
