import React, { useEffect, useState } from 'react';

export default function Toast({ message, type = 'info', duration = 4000, onClose }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => { setVisible(false); setTimeout(() => onClose?.(), 300); }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bg = {
    info: 'bg-blue-600',
    success: 'bg-green-600',
    warning: 'bg-amber-600',
    error: 'bg-red-600',
  }[type] || 'bg-slate-800';

  return (
    <div className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium flex items-center gap-3 z-50 transition-all ${bg} ${visible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
      <span>{type === 'success' ? '✅' : type === 'error' ? '🚨' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
      <span>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(() => onClose?.(), 300); }} className="ml-2 p-1 hover:bg-white/20 rounded-lg">✕</button>
    </div>
  );
}

export function ToastContainer({ toasts = [], removeToast }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-2">
      {toasts.map(t => <Toast key={t.id} message={t.message} type={t.type} onClose={() => removeToast(t.id)} />)}
    </div>
  );
}
