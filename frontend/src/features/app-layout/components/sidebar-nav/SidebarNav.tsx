'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { isActivePath, type NavGroups, type NavItem } from '../../navigation';
import s from './SidebarNav.module.css';

interface SidebarNavProps {
  groups: NavGroups;
}

export function SidebarNav({ groups }: SidebarNavProps) {
  const t = useTranslations('layout');

  return (
    <nav className={s.root} aria-label={t('navigation')}>
      <NavList items={groups.main} />
      {groups.admin.length > 0 && (
        <>
          <hr className={s.divider} />
          <NavList items={groups.admin} />
        </>
      )}
    </nav>
  );
}

function NavList({ items }: { items: NavItem[] }) {
  const t = useTranslations('nav');
  const pathname = usePathname();

  return (
    <ul className={s.list}>
      {items.map(({ href, labelKey, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            className={s.link}
            aria-current={isActivePath(pathname, href) ? 'page' : undefined}
          >
            <Icon className={s.icon} />
            <span>{t(labelKey)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
