'use client';

import { useQuery } from '@apollo/client/react';
import { notFound } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { USER } from '@/features/users/api/users.operations';
import { useFormatMemberSince } from '@/features/users/hooks/useFormatMemberSince';
import { getFullName } from '@/features/users/lib/getFullName';
import { Button } from '@/shared/components/buttons';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import s from './UserProfile.module.css';
import { ProfileAvatar } from './ProfileAvatar';
import { UserProfileForm } from './UserProfileForm';
import { UserProfileSkeleton } from './UserProfileSkeleton';

interface UserProfileProps {
  userId: string;
}

export const UserProfile = ({ userId }: UserProfileProps) => {
  const tProfile = useTranslations('users.profile');
  const formatMemberSince = useFormatMemberSince();

  const {
    user: currentUser,
    loading: currentUserLoading,
    refetch: refetchCurrentUser,
  } = useCurrentUser();
  const isOwner = currentUser?.id === userId;
  const canEdit = isOwner || currentUser?.role === 'ADMIN';

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

  if (!data || (currentUserLoading && !currentUser)) return <UserProfileSkeleton />;

  const reloadVerification = () => {
    void refetch();
    void refetchCurrentUser();
  };

  const { user } = data;
  const fullName = getFullName(user);

  return (
    <section className={s.root}>
      <header className={s.header}>
        <ProfileAvatar
          userId={user.id}
          avatarUrl={user.avatarUrl ?? null}
          fullName={fullName}
          canEdit={canEdit}
        />
        <div className={s.info}>
          <h1 className={s.name}>{fullName}</h1>
          <p className={s.email}>{user.email}</p>
          <p className={s.memberSince}>{formatMemberSince(user.createdAt)}</p>
        </div>
      </header>

      <UserProfileForm
        key={user.id}
        user={user}
        canEdit={canEdit}
        canVerifyEmail={isOwner && !user.emailVerifiedAt}
        onEmailAlreadyVerified={reloadVerification}
      />
    </section>
  );
};
