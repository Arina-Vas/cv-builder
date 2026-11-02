'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tabs as RadixTabs } from 'radix-ui';
import type { ReactNode } from 'react';

import styles from './Tabs.module.css';

export interface TabItem {
  href: string;
  label: string;
}

export interface TabsProps {
  items: readonly TabItem[];
  label: string;
  children: ReactNode;
  align?: 'start' | 'center';
}

export function getActiveHref(items: readonly TabItem[], pathname: string): string {
  return items
    .filter(({ href }) => pathname === href || pathname.startsWith(`${href}/`))
    .reduce((active, { href }) => (href.length > active.length ? href : active), '');
}

export function Tabs({ items, label, children, align = 'start' }: TabsProps) {
  const pathname = usePathname();
  const activeHref = getActiveHref(items, pathname);

  return (
    <RadixTabs.Root value={activeHref} activationMode="manual" className={styles.root}>
      <RadixTabs.List aria-label={label} className={styles.list} data-align={align}>
        {items.map(({ href, label: tabLabel }) => (
          <RadixTabs.Trigger key={href} value={href} asChild>
            <Link
              href={href}
              className={styles.tab}
              aria-current={href === activeHref ? 'page' : undefined}
            >
              {tabLabel}
            </Link>
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      <RadixTabs.Content value={activeHref} className={styles.content}>
        {children}
      </RadixTabs.Content>
    </RadixTabs.Root>
  );
}
