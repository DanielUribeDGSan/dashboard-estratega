import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className = '', noPadding = false, ...props }) => {
  return (
    <div 
      className={`bg-white rounded-2xl sm:rounded-3xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] border border-gray-100/50 ${noPadding ? '' : 'p-4 sm:p-6'} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
