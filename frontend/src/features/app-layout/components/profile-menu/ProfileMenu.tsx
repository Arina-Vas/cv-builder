'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { DropdownMenu } from 'radix-ui';
import { useLogout } from '@/features/auth/hooks/useLogout';
import type { MeQuery } from '@/gql/graphql';
import { Avatar } from '@/shared/components/avatar/Avatar';
import { LogoutIcon } from '@/shared/components/icons/LogoutIcon';
import { ProfileIcon } from '@/shared/components/icons/ProfileIcon';
import { SettingsIcon } from '@/shared/components/icons/SettingsIcon';
import s from './ProfileMenu.module.css';

interface ProfileMenuProps {
  user: MeQuery['me'];
  collapsed: boolean;
}

export function ProfileMenu({ user, collapsed }: ProfileMenuProps) {
  const t = useTranslations('layout');
  const { logout, loading } = useLogout();
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger className={s.trigger}>
        <Avatar size="md" color="primary" src={user.avatarUrl ?? undefined} fallback={fullName} />
        <span className={s.name}>{fullName}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={s.content}
          data-collapsed={collapsed}
          side="top"
          align="start"
          sideOffset={8}
        >
          <DropdownMenu.Item className={s.item} asChild>
            <Link href={`/users/${user.id}/profile`}>
              <ProfileIcon className={s.icon} />
              <span className={s.label}>{t('profile')}</span>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Item className={s.item} asChild>
            <Link href="/settings">
              <SettingsIcon className={s.icon} />
              <span className={s.label}>{t('settings')}</span>
            </Link>
          </DropdownMenu.Item>

          <DropdownMenu.Separator className={s.separator} />

          <DropdownMenu.Item className={s.item} disabled={loading} onSelect={() => void logout()}>
            <LogoutIcon className={s.icon} />
            <span className={s.label}>{t('logout')}</span>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
