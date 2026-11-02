import type { Messages } from 'next-intl';
import type { ComponentType, SVGProps } from 'react';
import type { UserRole } from '@/gql/graphql';
import { CvsIcon } from '@/shared/components/icons/CvsIcon';
import { DepartmentsIcon } from '@/shared/components/icons/DepartmentsIcon';
import { EmployeesIcon } from '@/shared/components/icons/EmployeesIcon';
import { LanguagesIcon } from '@/shared/components/icons/LanguagesIcon';
import { PositionsIcon } from '@/shared/components/icons/PositionsIcon';
import { ProjectsIcon } from '@/shared/components/icons/ProjectsIcon';
import { SkillsIcon } from '@/shared/components/icons/SkillsIcon';

export type NavLabelKey = keyof Messages['nav'];

export interface NavItem {
  href: string;
  labelKey: NavLabelKey;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  adminOnly: boolean;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { href: '/users', labelKey: 'employees', icon: EmployeesIcon, adminOnly: false },
  { href: '/skills', labelKey: 'skills', icon: SkillsIcon, adminOnly: false },
  { href: '/languages', labelKey: 'languages', icon: LanguagesIcon, adminOnly: false },
  { href: '/cvs', labelKey: 'cvs', icon: CvsIcon, adminOnly: false },
  { href: '/departments', labelKey: 'departments', icon: DepartmentsIcon, adminOnly: true },
  { href: '/positions', labelKey: 'positions', icon: PositionsIcon, adminOnly: true },
  { href: '/projects', labelKey: 'projects', icon: ProjectsIcon, adminOnly: true },
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
