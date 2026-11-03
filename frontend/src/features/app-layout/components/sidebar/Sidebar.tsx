'use client';

import { useTranslations } from 'next-intl';
import { type KeyboardEvent, type MouseEvent, useState } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { IconButton } from '@/shared/components/buttons';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { LogoIcon } from '@/shared/components/icons/LogoIcon';
import { useMediaQuery } from '@/shared/hooks/useMediaQuery';
import { getNavItems } from '../../navigation';
import { SIDEBAR_COOKIE, SIDEBAR_OVERLAY_QUERY } from '../../sidebar.constants';
import { ProfileMenu } from '../profile-menu/ProfileMenu';
import { SidebarNav } from '../sidebar-nav/SidebarNav';
import s from './Sidebar.module.css';

interface SidebarProps {
  defaultCollapsed: boolean;
}

export function Sidebar({ defaultCollapsed }: SidebarProps) {
  const t = useTranslations('layout');
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const isOverlay = useMediaQuery(SIDEBAR_OVERLAY_QUERY);
  const [overlayOpen, setOverlayOpen] = useState(false);
  const { user, error, refetch } = useCurrentUser();

  const overlayShown = isOverlay && overlayOpen;
  const isCollapsed = isOverlay ? !overlayOpen : collapsed;

  const toggleCollapsed = () => {
    if (isOverlay) {
      setOverlayOpen(!overlayOpen);
      return;
    }
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; samesite=lax`;
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (overlayShown && event.target instanceof Element && event.target.closest('a')) {
      setOverlayOpen(false);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      overlayShown &&
      event.key === 'Escape' &&
      !(event.target instanceof Element && event.target.closest('[role="menu"]'))
    ) {
      setOverlayOpen(false);
    }
  };

  return (
    <>
      {overlayShown && (
        <div
          className={s.backdrop}
          data-testid="sidebar-backdrop"
          aria-hidden
          onClick={() => setOverlayOpen(false)}
        />
      )}
      <aside
        className={s.root}
        data-collapsed={collapsed}
        data-overlay-open={overlayShown}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
      >
        <div className={s.header}>
          <LogoIcon className={s.logo} />
          <span className={s.title}>{t('appName')}</span>
        </div>

        <SidebarNav groups={getNavItems(user?.role ?? null)} />

        <div className={s.footer} aria-busy={!user && !error}>
          {user ? (
            <ProfileMenu user={user} collapsed={isCollapsed} />
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
          aria-label={isCollapsed ? t('expandSidebar') : t('collapseSidebar')}
          aria-expanded={!isCollapsed}
          onClick={toggleCollapsed}
        >
          <ChevronIcon direction={isCollapsed ? 'right' : 'left'} />
        </IconButton>
      </aside>
    </>
  );
}
