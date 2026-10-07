import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-[#f9fafc] border border-neutral-200/70 rounded-[32px] shadow-sm w-full max-w-[860px] min-h-[580px] p-8 md:p-14 flex flex-col items-center justify-between transition-all duration-300 ${className}`}
    >
      {children}
    </div>
  );
}
