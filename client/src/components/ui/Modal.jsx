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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-xs transition-opacity duration-200">
      <div
        className={`w-full max-w-lg bg-white rounded-xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150 ${className}`}
        role="dialog"
        aria-modal="true"
      >
        {title && (
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>
            {onClose && (
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-700 rounded-md p-1 hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        <div className="px-5 py-4 overflow-y-auto flex-1 text-slate-700 text-xs sm:text-sm">{children}</div>
        {footer && <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex justify-end gap-2 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}
