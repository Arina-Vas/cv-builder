import type { ComponentProps } from 'react';
import s from './Skeleton.module.css';

/**
 * One grey placeholder block with a wave. Its size and shape come from `className`;
 * a page builds its loading layout from these blocks. The block is decorative: the
 * container says what is loading (`aria-busy` + `aria-label`).
 */
export const Skeleton = ({ className, ...rest }: ComponentProps<'span'>) => (
  <span {...rest} aria-hidden className={[s.skeleton, className].filter(Boolean).join(' ')} />
);
