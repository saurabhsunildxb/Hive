import React from 'react';

export default function ErrorMessage({ message, onClose, className = '' }) {
  if (!message) return null;

  return (
    <div className={`p-4 text-sm rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between gap-3 ${className}`} role="alert">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-rose-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-rose-400 hover:text-rose-600 rounded-md p-0.5 focus:outline-none focus:ring-2 focus:ring-rose-400"
          aria-label="Close error"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
