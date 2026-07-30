import React from 'react';

interface BbvaMarkProps {
  className?: string;
}

export const BbvaMark: React.FC<BbvaMarkProps> = ({ className = '' }) => (
  <div
    aria-label="BBVA"
    className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#072f92] ${className}`}
  >
    <svg
      aria-hidden="true"
      viewBox="0 0 40 40"
      className="size-7"
      fill="none"
    >
      <path
        d="M7 11.5 20 28.5 33 11.5"
        stroke="white"
        strokeWidth="6"
        strokeLinecap="square"
        strokeLinejoin="miter"
      />
    </svg>
  </div>
);
