import React from 'react';

export default function CrowdHeatmap({ data = [], onZoneClick }) {
  const getColor = (percent) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 80) return 'bg-amber-500';
    if (percent >= 60) return 'bg-yellow-500';
    if (percent >= 40) return 'bg-blue-500';
    return 'bg-green-500';
  };

  const zones = data.length ? data : [
    { id: '1', name: 'Gate A', code: 'N-A', percent: 64, occupancy: 3200, capacity: 5000 },
    { id: '2', name: 'Gate B', code: 'S-B', percent: 82, occupancy: 4100, capacity: 5000 },
    { id: '3', name: 'Lower East', code: 'E-LOW', percent: 94, occupancy: 14200, capacity: 15000 },
    { id: '4', name: 'Concourse', code: 'CONC', percent: 74, occupancy: 7400, capacity: 10000 },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {zones.map(zone => (
        <button key={zone.id} onClick={() => onZoneClick?.(zone)} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-all text-left group">
          <div className="flex items-center justify-between mb-2"><span className="text-xs font-mono px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-700">{zone.code}</span><span className={`w-3 h-3 rounded-full ${getColor(zone.percent)} group-hover:scale-125 transition`}></span></div>
          <p className="font-medium text-sm">{zone.name}</p>
          <p className="text-xs text-slate-500">{zone.occupancy}/{zone.capacity} • {zone.percent}%</p>
          <div className="mt-3 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden"><div className={`h-1.5 rounded-full ${getColor(zone.percent)}`} style={{ width: `${zone.percent}%` }}></div></div>
        </button>
      ))}
    </div>
  );
}
