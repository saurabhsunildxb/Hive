import React, { useEffect } from 'react';

export default function Modal({ isOpen, onClose, title, children, footer, className = '' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity">
      <div
        className={`w-full max-w-lg bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-100 transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto flex-1 text-slate-700">{children}</div>
        {footer && <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
