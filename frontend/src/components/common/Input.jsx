import React from 'react';

export default function Input({ label, error, icon, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">{label}</label>}
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'} ${icon ? 'pl-10' : ''}`} {...props} />
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1">{label}</label>}
      <textarea className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`} rows={4} {...props} />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}

export function Select({ label, children, error, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-xs font-medium mb-1">{label}</label>}
      <select className={`w-full px-3 py-2.5 rounded-xl border bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 ${error ? 'border-red-300' : 'border-slate-200 dark:border-slate-700'}`} {...props}>{children}</select>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
