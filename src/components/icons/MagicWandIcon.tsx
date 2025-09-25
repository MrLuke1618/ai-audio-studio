import React from 'react';

export const MagicWandIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 4V2" />
    <path d="M15 22v-4" />
    <path d="M12.07 4.93 10.66 6.34" />
    <path d="M21 12.07 17.66 8.74" />
    <path d="M3 12.07 6.34 8.74" />
    <path d="M12.07 19.07 10.66 17.66" />
    <path d="M4 15H2" />
    <path d="M22 15h-4" />
    <path d="M4.93 12.07 6.34 10.66" />
    <path d="M19.07 12.07 17.66 10.66" />
    <path d="M19.07 3 4.93 17.14" />
  </svg>
);