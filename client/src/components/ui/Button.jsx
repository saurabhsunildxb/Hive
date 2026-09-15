import React from 'react';
import LoadingSpinner from './LoadingSpinner';

export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  className = '',
  onClick,
  ...props
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer';

  const variants = {
    primary:
      'bg-indigo-600 hover:bg-indigo-700 text-white focus:ring-indigo-500 shadow-sm border border-transparent',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 focus:ring-slate-400 border border-slate-200',
    outline:
      'bg-transparent hover:bg-slate-50 text-slate-700 border border-slate-300 focus:ring-indigo-500',
    danger:
      'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-sm border border-transparent',
    ghost:
      'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400 border border-transparent',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" className={variant === 'primary' || variant === 'danger' ? 'border-white' : ''} />
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
