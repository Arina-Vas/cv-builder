import s from './AvatarUploader.module.css';
import { UploadIcon } from '@/shared/components/icons/UploadIcon';
import { CloseIcon } from '@/shared/components/icons/CloseIcon';
import type { ChangeEvent } from 'react';
import Image from 'next/image';

const MAX_SIZE = 0.5 * 1024 * 1024; // 0.5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/gif'];

type Props = {
  src?: string;
  fallback: string;
  onRemove?: () => void;
  onChange?: (file: File) => void;
  disabled?: boolean;
  onError?: (message: string) => void;
};

export const AvatarUploader = ({ src, fallback, onChange, onRemove, onError, disabled }: Props) => {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      onError?.('Only png, jpg or gif allowed');
      return;
    }
    if (file.size > MAX_SIZE) {
      onError?.('File is larger than 0.5MB');
      return;
    }
    onChange?.(file);
  };

  return (
    <div className={s.wrapper}>
      <div className={s.image}>
        {src ? (
          <Image src={src} alt={fallback} fill sizes="120px" className={s.avatar} />
        ) : (
          <span className={s.fallback}>{fallback.charAt(0).toUpperCase()}</span>
        )}
        {src && !disabled && (
          <button
            type={'button'}
            aria-label={'Remove avatar'}
            onClick={onRemove}
            className={s.removeButton}
          >
            <CloseIcon />
          </button>
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
          Upload avatar image
        </span>
        <span className={s.hint}>png, jpg or gif no more than 0.5MB</span>
      </label>
    </div>
  );
};
