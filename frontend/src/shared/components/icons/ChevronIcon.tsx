import type { SVGProps } from 'react';

type Props = { direction: 'left' | 'right' | 'up' | 'down' } & SVGProps<SVGSVGElement>;

const PATH: Record<Props['direction'], string> = {
  up: 'M7.41 15.41 12 10.83l4.59 4.58L18 14l-6-6-6 6z',
  down: 'M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z',
  left: 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z',
  right: 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z',
};

export const ChevronIcon = ({ direction, ...rest }: Props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
    <path d={PATH[direction]} />
  </svg>
);
