import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles = 'w-full inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none select-none disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary: 'bg-[#22a6fe] hover:bg-[#1594e8] active:bg-[#0c85d7] text-white py-3 px-6 rounded-xl shadow-[0_8px_20px_-4px_rgba(34,166,254,0.4)] text-base font-semibold',
    secondary: 'bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 py-2.5 px-6 rounded-xl shadow-sm border border-neutral-200/80 text-sm font-medium',
    outline: 'border-2 border-[#22a6fe] text-[#22a6fe] hover:bg-blue-50/50 py-2.5 px-6 rounded-xl text-sm font-semibold',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <LoadingSpinner size="sm" className="text-current" />
          <span>Aguarde...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}
