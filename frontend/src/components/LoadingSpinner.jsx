import React from 'react';

export default function LoadingSpinner({ size = 'sm', className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  };

  return (
    <div
      className={`inline-block animate-spin rounded-full border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${sizeClasses[size] || sizeClasses.sm} ${className}`}
      role="status"
    >
      <span className="sr-only">Carregando...</span>
    </div>
  );
}
