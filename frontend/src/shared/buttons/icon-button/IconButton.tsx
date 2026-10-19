import type { ButtonHTMLAttributes } from 'react';

import styles from './IconButton.module.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  // No visible text, so the accessible name is required
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
