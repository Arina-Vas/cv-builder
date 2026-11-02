import type { SVGProps } from 'react';

export const LogoutIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <path d="M21 12H13" />
    <path d="M18 15L20.913 12.087C20.961 12.039 20.961 11.961 20.913 11.913L18 9" />
    <path d="M16 5V4.5C16 3.67157 15.3284 3 14.5 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H14.5C15.3284 21 16 20.3284 16 19.5V19" />
  </svg>
);
