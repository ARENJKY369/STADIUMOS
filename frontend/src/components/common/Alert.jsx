import React from 'react';

export default function Alert({ type = 'info', title, message, onClose, action, icon }) {
  const styles = {
    info: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200',
    success: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200',
    warning: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200',
    error: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200',
  };

  const icons = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '🚨',
  };

  return (
    <div className={`p-4 rounded-xl border flex gap-3 ${styles[type]}`}>
      <span className="text-lg">{icon || icons[type]}</span>
      <div className="flex-1">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {message && <p className="text-sm mt-1 opacity-90">{message}</p>}
        {action && <div className="mt-3">{action}</div>}
      </div>
      {onClose && <button onClick={onClose} className="p-1 hover:bg-black/10 rounded-lg text-sm">✕</button>}
    </div>
  );
}

export function EmergencyAlert({ title, message, zones, onAcknowledge, onDismiss }) {
  return (
    <div className="p-4 rounded-xl border-2 border-red-500 bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-100 animate-pulse">
      <div className="flex gap-3">
        <span className="text-2xl">🚨</span>
        <div className="flex-1">
          <p className="font-black text-sm uppercase tracking-wide">{title || 'EMERGENCY ALERT'}</p>
          <p className="text-sm mt-1 font-medium">{message}</p>
          {zones && <p className="text-xs mt-2 opacity-80">Affected zones: {zones.join(', ')}</p>}
          <div className="mt-3 flex gap-2">
            <button onClick={onAcknowledge} className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs font-bold hover:bg-red-700">Acknowledge</button>
            <button onClick={onDismiss} className="px-4 py-1.5 rounded-full bg-white dark:bg-slate-800 border text-xs">Dismiss</button>
          </div>
        </div>
      </div>
    </div>
  );
}
