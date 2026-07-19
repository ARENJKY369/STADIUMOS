import React from 'react';

export default function Badge({ children, variant = 'default', size = 'md', className = '' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300',
    success: 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
    warning: 'bg-amber-500/10 text-amber-700 border-amber-500/20 dark:text-amber-400',
    danger: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
    info: 'bg-blue-500/10 text-blue-700 border-blue-500/20 dark:text-blue-400',
    live: 'bg-red-500 text-white border-red-600 animate-pulse',
  };
  const sizes = { sm: 'px-2 py-0.5 text-xs', md: 'px-2.5 py-1 text-xs', lg: 'px-3 py-1.5 text-sm' };
  return <span className={`inline-flex items-center font-medium rounded-full border ${variants[variant]} ${sizes[size]} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const map = {
    open: 'success', closed: 'default', restricted: 'warning', evacuation: 'danger',
    reported: 'danger', acknowledged: 'warning', in_progress: 'info', resolved: 'success', live: 'live',
    scheduled: 'info', completed: 'success', cancelled: 'default',
  };
  return <Badge variant={map[status] || 'default'}>{status.replace('_',' ')}</Badge>;
}
