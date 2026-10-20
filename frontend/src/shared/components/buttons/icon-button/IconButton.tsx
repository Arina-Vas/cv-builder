import type { ComponentProps } from 'react';

import styles from './IconButton.module.css';

export interface IconButtonProps extends ComponentProps<'button'> {
  'aria-label': string;
}

export function IconButton({ type = 'button', className, children, ...rest }: IconButtonProps) {
  const classes = [styles.iconButton, className].filter(Boolean).join(' ');

  return (
    <button {...rest} type={type} className={classes}>
      {children}
    </button>
  );
}
