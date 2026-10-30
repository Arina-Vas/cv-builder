'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { AuthRoute } from '../../auth.constants';
import styles from './AuthTabs.module.css';

const TABS = [
  { href: AuthRoute.signIn, label: 'signIn' },
  { href: AuthRoute.signUp, label: 'signUp' },
] as const;

export function AuthTabs() {
  const pathname = usePathname();
  const t = useTranslations('auth.tabs');

  return (
    <nav className={styles.tabs} aria-label={t('label')}>
      {TABS.map(({ href, label }) => (
        <Link
          key={href}
          href={href}
          className={styles.tab}
          aria-current={pathname === href ? 'page' : undefined}
        >
          {t(label)}
        </Link>
      ))}
    </nav>
  );
}
