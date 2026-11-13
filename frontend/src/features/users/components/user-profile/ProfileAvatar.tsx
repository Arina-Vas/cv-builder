'use client';

import { useMutation } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { REMOVE_AVATAR, UPLOAD_AVATAR } from '@/features/users/api/users.operations';
import { Avatar } from '@/shared/components/avatar/Avatar';
import { AvatarUploader } from '@/shared/components/avatar-uploader/AvatarUploader';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';

interface ProfileAvatarProps {
  userId: string;
  avatarUrl: string | null;
  fullName: string;
  canEdit: boolean;
}

export const ProfileAvatar = ({ userId, avatarUrl, fullName, canEdit }: ProfileAvatarProps) => {
  const t = useTranslations('users.profile');
  const tUploader = useTranslations('common.avatarUploader');
  const toast = useToast();
  const errorMessage = useErrorMessage();

  const [uploadAvatar, upload] = useMutation(UPLOAD_AVATAR, { context: NO_ERROR_TOAST });
  const [removeAvatar, removal] = useMutation(REMOVE_AVATAR, { context: NO_ERROR_TOAST });

  if (!canEdit) {
    return <Avatar src={avatarUrl ?? undefined} fallback={fullName} />;
  }

  const showError = (error: unknown) => {
    const appError = parseError(error);

    if (appError.code === 'BAD_USER_INPUT') {
      toast.error(tUploader('invalidType'));
    } else if (appError.code) {
      toast.error(errorMessage(appError));
    } else {
      toast.error(t('avatarFailed'));
    }
  };

  const handleChange = async (file: File) => {
    try {
      await uploadAvatar({ variables: { userId, file } });
      toast.success(t('avatarUpdated'));
    } catch (error) {
      showError(error);
    }
  };

  const handleRemove = async () => {
    try {
      await removeAvatar({ variables: { userId } });
      toast.success(t('avatarRemoved'));
    } catch (error) {
      showError(error);
    }
  };

  return (
    <AvatarUploader
      src={avatarUrl ?? undefined}
      fallback={fullName}
      loading={upload.loading || removal.loading}
      onChange={(file) => void handleChange(file)}
      onRemove={() => void handleRemove()}
      onError={(message) => toast.error(message)}
    />
  );
};
