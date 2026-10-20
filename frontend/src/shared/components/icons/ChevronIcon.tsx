import type { SVGProps } from 'react';

type Props = { direction: 'left' | 'right' } & SVGProps<SVGSVGElement>;

export const ChevronIcon = ({ direction, ...rest }: Props) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...rest}>
    <path
      d={
        direction === 'left'
          ? 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z'
          : 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z'
      }
    />
  </svg>
);
