'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import styles from './AuthTabs.module.css';

const TABS = [
  { href: '/login', label: 'SIGN IN' },
  { href: '/register', label: 'SIGN UP' },
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
