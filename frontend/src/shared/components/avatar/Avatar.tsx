import s from './Avatar.module.css';
import Image from 'next/image';

const SIZES = { md: '40px', lg: '120px' } as const;

export type AvatarSize = keyof typeof SIZES;
export type AvatarColor = 'default' | 'primary';

export interface AvatarProps {
  src?: string;
  fallback: string;
  size?: AvatarSize;
  color?: AvatarColor;
}

export const Avatar = ({ src, fallback, size = 'lg', color = 'default' }: AvatarProps) => {
  return (
    <div className={s.root} data-size={size} data-color={color}>
      {src ? (
        <Image src={src} alt={fallback} fill sizes={SIZES[size]} className={s.image} />
      ) : (
        <span className={s.fallback}>{fallback.charAt(0).toUpperCase()}</span>
      )}
    </div>
  );
};
