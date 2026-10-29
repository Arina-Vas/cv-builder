'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { AuthRoute } from '../../auth.constants';
import styles from './AuthTabs.module.css';

const TABS = [
  { href: AuthRoute.signIn, label: 'SIGN IN' },
  { href: AuthRoute.signUp, label: 'SIGN UP' },
];

export function AuthTabs() {
  const pathname = usePathname();

  return (
    <nav className={styles.tabs} aria-label="Authentication">
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={styles.tab}
          aria-current={pathname === href ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
