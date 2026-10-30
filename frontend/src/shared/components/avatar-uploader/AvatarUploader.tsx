import s from './AvatarUploader.module.css';
import { UploadIcon } from '@/shared/components/icons/UploadIcon';
import type { ChangeEvent } from 'react';
import { Avatar } from '@/shared/components/avatar/Avatar';
import { CloseIcon } from '@/shared/components/icons/CloseIcon';
import { IconButton } from '@/shared/components/buttons';
import { useTranslations } from 'next-intl';

const MAX_SIZE = 0.5 * 1024 * 1024; // 0.5MB
const MAX_SIZE_LABEL = '0.5MB';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

export interface AvatarUploaderProps {
  src?: string;
  fallback: string;
  onRemove?: () => void;
  onChange?: (file: File) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
}

export const AvatarUploader = ({
  src,
  fallback,
  onChange,
  onRemove,
  onError,
  disabled,
}: AvatarUploaderProps) => {
  const t = useTranslations('common.avatarUploader');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.(t('invalidType'));
      return;
    }
    if (file.size > MAX_SIZE) {
      onError?.(t('tooLarge', { maxSize: MAX_SIZE_LABEL }));
      return;
    }
    onChange?.(file);
  };

  return (
    <div className={s.wrapper}>
      <div className={s.avatar}>
        <Avatar src={src} fallback={fallback} size="lg" />
        {src && !disabled && (
          <IconButton aria-label={t('remove')} onClick={onRemove} className={s.removeButton}>
            <CloseIcon />
          </IconButton>
        )}
      </div>
      <label className={s.uploader} data-disabled={disabled || undefined}>
        <input
          type={'file'}
          disabled={disabled}
          accept={ALLOWED_TYPES.join(',')}
          className={s.fileInput}
          onChange={handleChange}
        />
        <span className={s.title}>
          <UploadIcon />
          {t('upload')}
        </span>
        <span className={s.hint}>{t('hint', { maxSize: MAX_SIZE_LABEL })}</span>
      </label>
    </div>
  );
};
