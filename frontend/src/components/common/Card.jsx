import React from 'react';

export default function Card({ children, className = '', title, subtitle, action, hover = false, padding = true }) {
  return (
    <div className={`bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm ${hover ? 'hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all' : ''} ${className}`}>
      {(title || subtitle || action) && (
        <div className="p-5 border-b border-slate-200 dark:border-slate-700 flex items-start justify-between">
          <div>
            {title && <h3 className="font-semibold text-slate-900 dark:text-white">{title}</h3>}
            {subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className={padding ? 'p-5' : ''}>{children}</div>
    </div>
  );
}

export function StatCard({ label, value, change, icon, color = 'blue', trend }) {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    green: 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20',
    red: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
  };
  return (
    <Card className="relative overflow-hidden" hover>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</p>
          {change && (
            <p className={`text-xs mt-1 flex items-center gap-1 ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-500'}`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'} {change}
            </p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${colorMap[color]}`}>{icon}</div>
      </div>
      <div className={`absolute bottom-0 left-0 right-0 h-1 ${color === 'blue' ? 'bg-blue-500' : color === 'green' ? 'bg-green-500' : color === 'red' ? 'bg-red-500' : 'bg-slate-300'}`}></div>
    </Card>
  );
}
