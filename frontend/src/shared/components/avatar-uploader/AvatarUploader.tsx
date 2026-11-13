import s from './AvatarUploader.module.css';
import { UploadIcon } from '@/shared/components/icons/UploadIcon';
import type { ChangeEvent, MouseEvent } from 'react';
import { Avatar } from '@/shared/components/avatar/Avatar';
import { CloseIcon } from '@/shared/components/icons/CloseIcon';
import { IconButton } from '@/shared/components/buttons';
import { useActionGate } from '@/shared/lib/action-gate/ActionGate';
import { useTranslations } from 'next-intl';

export const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const MAX_SIZE_LABEL = '5 MB';
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

export interface AvatarUploaderProps {
  src?: string;
  fallback: string;
  onRemove?: () => void;
  onChange?: (file: File) => void;
  disabled?: boolean;
  loading?: boolean;
  onError?: (message: string) => void;
}

export const AvatarUploader = ({
  src,
  fallback,
  onChange,
  onRemove,
  onError,
  disabled,
  loading = false,
}: AvatarUploaderProps) => {
  const t = useTranslations('common.avatarUploader');
  const gate = useActionGate();
  const inactive = disabled || loading;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.(t('invalidType'));
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      onError?.(t('tooLarge', { maxSize: MAX_SIZE_LABEL }));
      return;
    }
    onChange?.(file);
  };

  const handleInputClick = (e: MouseEvent<HTMLInputElement>) => {
    if (gate.locked) {
      e.preventDefault();
      gate.guard(() => undefined)();
    }
  };

  return (
    <div className={s.wrapper} aria-busy={loading || undefined}>
      <div className={s.avatar}>
        <Avatar src={src} fallback={fallback} size="lg" />
        {loading && (
          <span className={s.loading} role="status">
            <span className={s.spinner} aria-hidden="true" />
            <span className={s.visuallyHidden}>{t('uploading')}</span>
          </span>
        )}
        {src && !inactive && (
          <IconButton
            aria-label={t('remove')}
            aria-disabled={gate.locked || undefined}
            onClick={gate.guard(() => onRemove?.())}
            className={s.removeButton}
          >
            <CloseIcon />
          </IconButton>
        )}
      </div>
      <label className={s.uploader} data-disabled={inactive || gate.locked || undefined}>
        <input
          type={'file'}
          disabled={inactive}
          aria-disabled={gate.locked || undefined}
          accept={ALLOWED_TYPES.join(',')}
          className={s.fileInput}
          onClick={handleInputClick}
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
