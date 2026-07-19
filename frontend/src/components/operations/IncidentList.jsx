import React from 'react';
import Badge, { StatusBadge } from '../common/Badge';
import Button from '../common/Button';

export default function IncidentList({ incidents = [], onAction, compact = false }) {
  const mock = incidents.length ? incidents : [
    { id: '1', title: 'Medical assistance needed Gate A', type: 'medical', severity: 'high', status: 'reported', zone_name: 'Gate A', created_at: new Date().toISOString(), reported_by_name: 'John Staff' },
    { id: '2', title: 'Crowding at Main Concourse', type: 'crowd', severity: 'medium', status: 'in_progress', zone_name: 'Concourse', created_at: new Date(Date.now()-3600000).toISOString(), reported_by_name: 'Mike Security' },
    { id: '3', title: 'Technical issue with turnstile', type: 'technical', severity: 'low', status: 'acknowledged', zone_name: 'Gate B', created_at: new Date(Date.now()-7200000).toISOString(), reported_by_name: 'System Auto' },
  ];

  if (compact) {
    return (
      <div className="space-y-2">
        {mock.slice(0,3).map(inc => (
          <div key={inc.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
            <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${inc.severity==='critical' ? 'bg-red-500' : inc.severity==='high' ? 'bg-amber-500' : 'bg-blue-500'}`}></span><span className="text-sm font-medium truncate max-w-[160px]">{inc.title}</span></div>
            <Badge variant={inc.severity==='critical' || inc.severity==='high' ? 'danger' : inc.severity==='medium' ? 'warning' : 'info'} size="sm">{inc.severity}</Badge>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {mock.map(inc => (
        <div key={inc.id} className={`p-4 rounded-xl border-2 bg-white dark:bg-slate-800 ${inc.severity==='critical' ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : inc.severity==='high' ? 'border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm ${inc.type==='medical' ? 'bg-red-500/10 text-red-600' : inc.type==='security' ? 'bg-blue-500/10 text-blue-600' : inc.type==='crowd' ? 'bg-amber-500/10 text-amber-600' : 'bg-slate-100 text-slate-600'}`}>{inc.type==='medical' ? '🏥' : inc.type==='security' ? '🛡️' : inc.type==='crowd' ? '👥' : '🔧'}</div>
              <div><p className="font-medium text-sm">{inc.title}</p><p className="text-xs text-slate-500 mt-1 flex items-center gap-2"><span>{inc.zone_name} • {inc.type}</span><span>•</span><span>{new Date(inc.created_at).toLocaleTimeString()}</span><span>•</span><span>{inc.reported_by_name}</span></p></div>
            </div>
            <div className="flex items-center gap-2"><Badge variant={inc.severity==='critical' ? 'danger' : inc.severity==='high' ? 'warning' : 'info'} size="sm">{inc.severity}</Badge><StatusBadge status={inc.status} /></div>
          </div>
          {onAction && <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={() => onAction('acknowledge', inc)}>Acknowledge</Button><Button size="sm" onClick={() => onAction('resolve', inc)}>Resolve</Button><Button size="sm" variant="ghost" onClick={() => onAction('view', inc)}>View Details</Button></div>}
        </div>
      ))}
    </div>
  );
}
