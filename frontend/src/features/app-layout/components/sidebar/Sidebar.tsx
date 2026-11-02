'use client';

import { useTranslations } from 'next-intl';
import { LogoIcon } from '@/shared/components/icons/LogoIcon';
import s from './Sidebar.module.css';

export function Sidebar() {
  const t = useTranslations('layout');

  return (
    <aside className={s.root}>
      <div className={s.header}>
        <LogoIcon className={s.logo} />
        <span className={s.title}>{t('appName')}</span>
      </div>
    </aside>
  );
}
