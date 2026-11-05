import Link from 'next/link';
import type { ComponentType, SVGProps } from 'react';

import { ChevronIcon } from '../icons/ChevronIcon';
import styles from './Breadcrumbs.module.css';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
  variant?: 'default' | 'entity';
  loading?: boolean;
}

export interface BreadcrumbsProps {
  items: readonly BreadcrumbItem[];
  label: string;
}

export function Breadcrumbs({ items, label }: BreadcrumbsProps) {
  return (
    <nav aria-label={label} className={styles.root}>
      <ol className={styles.list}>
        {items.map((item, index) => (
          <li key={`${index}-${item.label}`} className={styles.item} data-variant={item.variant}>
            {index > 0 && <ChevronIcon direction="right" className={styles.separator} />}
            <Crumb item={item} isCurrent={index === items.length - 1} />
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Crumb({ item, isCurrent }: { item: BreadcrumbItem; isCurrent: boolean }) {
  const { label, href, icon: Icon, loading } = item;

  if (loading) {
    return <span className={styles.skeleton} aria-hidden />;
  }

  const content = (
    <>
      {Icon && <Icon className={styles.icon} />}
      <span className={styles.label}>{label}</span>
    </>
  );

  if (isCurrent || !href) {
    return (
      <span className={styles.crumb} title={label} aria-current={isCurrent ? 'page' : undefined}>
        {content}
      </span>
    );
  }

  return (
    <Link href={href} className={styles.crumb} title={label}>
      {content}
    </Link>
  );
}
