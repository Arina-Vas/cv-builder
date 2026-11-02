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
  const { user, error, refetch } = useCurrentUser();

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

      <div className={s.footer} aria-busy={!user && !error}>
        {user ? (
          <ProfileMenu user={user} collapsed={collapsed} />
        ) : error ? (
          <button type="button" className={s.retry} onClick={() => void refetch()}>
            <span className={s.retryBadge} aria-hidden>
              !
            </span>
            <span className={s.retryText}>{t('profileRetry')}</span>
          </button>
        ) : (
          <div className={s.skeleton} aria-hidden>
            <span className={s.skeletonAvatar} />
            <span className={s.skeletonName} />
          </div>
        )}
      </div>

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
