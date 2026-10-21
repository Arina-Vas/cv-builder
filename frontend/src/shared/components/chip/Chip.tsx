import type { ReactNode } from 'react';

import styles from './Chip.module.css';

export interface ChipProps {
  children: ReactNode;
}

export function Chip({ children }: ChipProps) {
  return <span className={styles.chip}>{children}</span>;
}
