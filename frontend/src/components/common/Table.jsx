import React from 'react';

export default function Table({ columns, data, loading = false, emptyMessage = 'No data available' }) {
  if (loading) return <div className="p-8 text-center"><div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mx-auto"></div><p className="text-sm text-slate-500 mt-2">Loading...</p></div>;
  if (!data || data.length === 0) return <div className="p-12 text-center text-slate-500"><p className="text-3xl mb-2">📭</p><p className="text-sm">{emptyMessage}</p></div>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="text-left text-xs text-slate-500 border-b border-slate-200 dark:border-slate-700">{columns.map(col => <th key={col.key} className="pb-3 font-medium px-3">{col.label}</th>)}</tr></thead>
        <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
          {data.map((row, idx) => (
            <tr key={row.id || idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
              {columns.map(col => <td key={col.key} className="py-3 px-3">{col.render ? col.render(row[col.key], row) : row[col.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
