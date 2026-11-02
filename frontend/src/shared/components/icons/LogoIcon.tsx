import type { SVGProps } from 'react';

export const LogoIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden {...props}>
    <rect width="24" height="24" rx="3.5" style={{ fill: 'var(--text)' }} />
    <rect x="8.35" y="5.28" width="3.7" height="13.57" rx="0.6" style={{ fill: 'var(--bg)' }} />
    <circle cx="16.78" cy="8.68" r="2.03" style={{ fill: 'var(--primary)' }} />
  </svg>
);
