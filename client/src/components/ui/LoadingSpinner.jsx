import React from 'react';

export default function LoadingSpinner({ size = 'md', fullPage = false, className = '' }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  const spinner = (
    <div
      className={`inline-block animate-spin rounded-full border-indigo-600 border-t-transparent ${sizeClasses[size] || sizeClasses.md} ${className}`}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        {spinner}
        <p className="mt-4 text-sm font-medium text-slate-500">Loading Hive...</p>
      </div>
    );
  }

  return spinner;
}
