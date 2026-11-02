'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { IconButton } from '@/shared/components/buttons';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { LogoIcon } from '@/shared/components/icons/LogoIcon';
import { getNavItems } from '../../navigation';
import { SIDEBAR_COOKIE } from '../../sidebar.constants';
import { ProfileMenu } from '../profile-menu/ProfileMenu';
import { SidebarNav } from '../sidebar-nav/SidebarNav';
import s from './Sidebar.module.css';

interface SidebarProps {
  defaultCollapsed: boolean;
}

export function Sidebar({ defaultCollapsed }: SidebarProps) {
  const t = useTranslations('layout');
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const { user } = useCurrentUser();

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; samesite=lax`;
  };

  return (
    <aside className={s.root} data-collapsed={collapsed}>
      <div className={s.header}>
        <LogoIcon className={s.logo} />
        <span className={s.title}>{t('appName')}</span>
      </div>

      <SidebarNav groups={getNavItems(user?.role ?? null)} />

      <div className={s.footer}>{user && <ProfileMenu user={user} collapsed={collapsed} />}</div>

      <IconButton
        className={s.toggle}
        aria-label={collapsed ? t('expandSidebar') : t('collapseSidebar')}
        aria-expanded={!collapsed}
        onClick={toggleCollapsed}
      >
        <ChevronIcon direction={collapsed ? 'right' : 'left'} />
      </IconButton>
    </aside>
  );
}
