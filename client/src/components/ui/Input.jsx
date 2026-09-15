import React from 'react';

export default function Input({
  label,
  error,
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  helpText,
  ...props
}) {
  const inputId = id || name || Math.random().toString(36).substring(2, 9);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-slate-700 flex items-center justify-between">
          <span>
            {label}
            {required && <span className="text-rose-500 ml-0.5">*</span>}
          </span>
        </label>
      )}
      <input
        type={type}
        id={inputId}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`w-full px-3.5 py-2 text-sm bg-white border rounded-lg shadow-xs transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed ${
          error ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-300'
        }`}
        {...props}
      />
      {error && <span className="text-xs font-medium text-rose-600">{error}</span>}
      {helpText && !error && <span className="text-xs text-slate-500">{helpText}</span>}
    </div>
  );
}
