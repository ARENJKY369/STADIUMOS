import React, { useState } from 'react';
import Badge from '../common/Badge';

export default function ZoneMap({ zones = [], onSelect, selectedId }) {
  const [viewMode, setViewMode] = useState('grid'); // grid, list
  
  const mockZones = zones.length ? zones : [
    { id: '1', name: 'North Entrance Gate A', code: 'N-A', type: 'entrance', capacity: 5000, current_occupancy: 3200, status: 'open', risk: 'low' },
    { id: '2', name: 'South Entrance Gate B', code: 'S-B', type: 'entrance', capacity: 5000, current_occupancy: 4100, status: 'open', risk: 'high' },
    { id: '3', name: 'East Seating Lower', code: 'E-LOW-1', type: 'seating', capacity: 15000, current_occupancy: 14200, status: 'open', risk: 'critical' },
    { id: '4', name: 'Main Concourse', code: 'CONC-M', type: 'concourse', capacity: 10000, current_occupancy: 7400, status: 'open', risk: 'medium' },
  ];

  const getRiskColor = (risk) => {
    if (risk === 'critical') return 'border-red-500 bg-red-50 dark:bg-red-900/20';
    if (risk === 'high') return 'border-amber-500 bg-amber-50 dark:bg-amber-900/20';
    if (risk === 'medium') return 'border-blue-500 bg-blue-50 dark:bg-blue-900/20';
    return 'border-green-500 bg-green-50 dark:bg-green-900/20';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Stadium Layout • {mockZones.length} zones</p>
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button onClick={() => setViewMode('grid')} className={`px-3 py-1 rounded-md text-xs ${viewMode==='grid' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>Grid</button>
          <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-xs ${viewMode==='list' ? 'bg-white dark:bg-slate-700 shadow' : ''}`}>List</button>
        </div>
      </div>

      <div className={viewMode==='grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2'}>
        {mockZones.map(zone => {
          const percent = Math.round((zone.current_occupancy / zone.capacity)*100);
          const isSelected = selectedId === zone.id;
          return (
            <button key={zone.id} onClick={() => onSelect?.(zone)} className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md ${isSelected ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md' : getRiskColor(zone.risk)}`}>
              <div className="flex items-start justify-between">
                <div><p className="font-semibold text-sm">{zone.name}</p><p className="text-xs text-slate-500 mt-1">{zone.code} • {zone.type} • Level {zone.level || 'Ground'}</p></div>
                <Badge variant={zone.risk==='critical' ? 'danger' : zone.risk==='high' ? 'warning' : zone.risk==='medium' ? 'info' : 'success'} size="sm">{zone.risk}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs"><span>{zone.current_occupancy}/{zone.capacity} fans</span><span className="font-bold">{percent}%</span></div>
              <div className="mt-2 w-full bg-white dark:bg-slate-800 rounded-full h-2 overflow-hidden"><div className={`h-2 rounded-full ${percent>=90 ? 'bg-red-500' : percent>=80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${percent}%` }}></div></div>
              <div className="mt-2 flex gap-1">
                <span className="text-[10px] px-2 py-1 rounded-full bg-white dark:bg-slate-800 border">{zone.status}</span>
                {percent>=80 && <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/20 text-amber-700 border border-amber-500/20">Action needed</span>}
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-xs font-medium">Legend: Risk Levels</p>
        <div className="flex gap-3 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-green-500 rounded-full"></span> Low &lt;60%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Medium 60-80%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-amber-500 rounded-full"></span> High 80-90%</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span> Critical &gt;90%</span>
        </div>
      </div>
    </div>
  );
}
