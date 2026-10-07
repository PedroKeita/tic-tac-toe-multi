import React from 'react';

export default function Input({
  label,
  id,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  autoComplete,
  className = '',
  isActive = false,
  ...props
}) {
  return (
    <div className="w-full text-left">
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          autoComplete={autoComplete}
          className={`w-full bg-[#edf2fc] text-neutral-800 placeholder-neutral-400 text-sm px-4 py-3.5 rounded-xl transition-all duration-150 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#22a6fe]/30 ${
            error
              ? 'border-2 border-red-500 bg-red-50/40'
              : isActive
              ? 'border-2 border-[#3b82f6]'
              : 'border border-transparent hover:border-neutral-300/80 focus:border-[#22a6fe]'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 font-medium animate-fadeIn">
          {error}
        </p>
      )}
    </div>
  );
}
