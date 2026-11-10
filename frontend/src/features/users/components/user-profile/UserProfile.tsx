'use client';

import { useQuery } from '@apollo/client/react';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { USER } from '@/features/users/api/users.operations';
import { useFormatMemberSince } from '@/features/users/hooks/useFormatMemberSince';
import { getFullName } from '@/features/users/lib/getFullName';
import { Avatar } from '@/shared/components/avatar/Avatar';
import { Button } from '@/shared/components/buttons';
import layout from '@/shared/components/form/FormLayout.module.css';
import { Input } from '@/shared/components/inputs';
import { Select } from '@/shared/components/select/Select';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import s from './UserProfile.module.css';
import { UserProfileSkeleton } from './UserProfileSkeleton';

interface UserProfileProps {
  userId: string;
}

const toOptions = (item?: { id: string; name: string } | null): SelectOption[] =>
  item ? [{ value: item.id, label: item.name }] : [];

export const UserProfile = ({ userId }: UserProfileProps) => {
  const t = useTranslations('users.fields');
  const tProfile = useTranslations('users.profile');
  const formatMemberSince = useFormatMemberSince();

  const { data, loading, error, refetch } = useQuery(USER, { variables: { id: userId } });

  if (error) {
    if (hasErrorCode(error, 'NOT_FOUND')) notFound();

    return (
      <div className={s.error} role="alert">
        <p className={s.errorText}>{tProfile('loadError')}</p>
        <Button variant="secondary" size="sm" loading={loading} onClick={() => refetch()}>
          {tProfile('retry')}
        </Button>
      </div>
    );
  }

  if (!data) return <UserProfileSkeleton />;

  const { user } = data;
  const fullName = getFullName(user);

  return (
    <section className={s.root}>
      <header className={s.header}>
        <Avatar src={user.avatarUrl ?? undefined} fallback={fullName} />
        <div className={s.info}>
          <h1 className={s.name}>{fullName}</h1>
          <p className={s.email}>{user.email}</p>
          <p className={s.memberSince}>{formatMemberSince(user.createdAt)}</p>
        </div>
      </header>

      <form className={`${layout.grid} ${s.form}`}>
        <Input label={t('firstName')} value={user.firstName ?? ''} readOnly disabled />
        <Input label={t('lastName')} value={user.lastName ?? ''} readOnly disabled />
        <Select
          label={t('department')}
          options={toOptions(user.department)}
          value={user.department?.id ?? ''}
          disabled
        />
        <Select
          label={t('position')}
          options={toOptions(user.position)}
          value={user.position?.id ?? ''}
          disabled
        />
      </form>
    </section>
  );
};
