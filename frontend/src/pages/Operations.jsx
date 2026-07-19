import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Operations() {
  const [selectedZone, setSelectedZone] = useState(null);
  const zones = [
    { id: '1', name: 'North Entrance Gate A', code: 'N-A', type: 'entrance', capacity: 5000, current: 3200, status: 'open', risk: 'low', staff: 4 },
    { id: '2', name: 'South Entrance Gate B', code: 'S-B', type: 'entrance', capacity: 5000, current: 4100, status: 'open', risk: 'high', staff: 6 },
    { id: '3', name: 'East Seating Lower', code: 'E-LOW-1', type: 'seating', capacity: 15000, current: 14200, status: 'open', risk: 'critical', staff: 12 },
    { id: '4', name: 'Main Concourse', code: 'CONC-M', type: 'concourse', capacity: 10000, current: 7400, status: 'open', risk: 'medium', staff: 8 },
    { id: '5', name: 'VIP Lounge L3', code: 'VIP-3', type: 'vip', capacity: 500, current: 320, status: 'open', risk: 'low', staff: 3 },
    { id: '6', name: 'Medical Center', code: 'MED-G', type: 'medical', capacity: 100, current: 12, status: 'open', risk: 'low', staff: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Operations Center</h1><p className="text-sm text-slate-500">Zone management • Crowd control • Staff coordination</p></div>
        <div className="flex gap-2"><Button variant="secondary">Export Report</Button><Button>Emergency Protocol</Button></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Stadium Map" subtitle="Interactive zone overview" className="lg:col-span-2" padding={false}>
          <div className="p-4">
            <div className="relative bg-slate-100 dark:bg-slate-900 rounded-xl h-96 overflow-hidden border border-slate-200 dark:border-slate-700 flex items-center justify-center">
              <div className="grid grid-cols-3 gap-3 w-full p-6">
                {zones.map(z => (
                  <button key={z.id} onClick={() => setSelectedZone(z)} className={`p-3 rounded-xl border-2 text-left transition-all ${selectedZone?.id===z.id ? 'border-blue-500 bg-blue-500/10' : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 hover:border-slate-400'} ${z.risk==='critical' ? 'ring-2 ring-red-500/50' : z.risk==='high' ? 'ring-2 ring-amber-500/50' : ''}`}>
                    <p className="font-medium text-sm">{z.name}</p><p className="text-xs text-slate-500">{z.code} • {z.type}</p>
                    <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className={`h-1.5 rounded-full ${z.risk==='critical' ? 'bg-red-500' : z.risk==='high' ? 'bg-amber-500' : z.risk==='medium' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ width: `${(z.current/z.capacity*100)}%` }}></div></div>
                    <p className="text-xs mt-1">{z.current}/{z.capacity} • {z.staff} staff</p>
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 flex gap-2 text-xs">
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500"></span> Low Risk</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500"></span> High</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Critical</span>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card title={selectedZone ? selectedZone.name : 'Select a Zone'} subtitle={selectedZone ? `${selectedZone.code} • ${selectedZone.type}` : 'Click map to inspect'}>
            {selectedZone ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-slate-500">Occupancy</p><p className="font-bold">{selectedZone.current}/{selectedZone.capacity}</p><p className="text-xs">{((selectedZone.current/selectedZone.capacity)*100).toFixed(1)}%</p></div>
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"><p className="text-xs text-slate-500">Staff</p><p className="font-bold">{selectedZone.staff} on duty</p><p className="text-xs">Performance 4.8</p></div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Actions</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="secondary">View Cam</Button>
                    <Button size="sm" variant="secondary">Staff List</Button>
                    <Button size="sm">Redirect Flow</Button>
                    <Button size="sm" variant="danger">Evacuate</Button>
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"><p className="text-xs font-medium text-blue-700 dark:text-blue-300">AI Recommendation</p><p className="text-xs text-slate-700 dark:text-slate-300 mt-1">Open secondary exit East-2 to reduce density by 15% in 8 minutes. Estimated flow improvement 320 ppl/min.</p></div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500"><p className="text-3xl mb-2">🗺️</p><p className="text-sm">Select a zone on map to see details and take actions</p></div>
            )}
          </Card>

          <Card title="Quick Actions" subtitle="Emergency and operations">
            <div className="space-y-2">
              <button className="w-full p-3 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium flex items-center gap-2"><span>🚨</span> Broadcast Emergency Alert</button>
              <button className="w-full p-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium flex items-center gap-2"><span>🚧</span> Initiate Evacuation</button>
              <button className="w-full p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-medium flex items-center gap-2"><span>🔒</span> Lockdown Stadium</button>
              <button className="w-full p-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium flex items-center gap-2"><span>📢</span> PA Announcement</button>
            </div>
          </Card>
        </div>
      </div>

      <Card title="Staff Coordination" subtitle="On-duty assignments">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b"><th className="pb-2 font-medium">Staff</th><th className="pb-2 font-medium">Zone</th><th className="pb-2 font-medium">Task</th><th className="pb-2 font-medium">Status</th><th className="pb-2 font-medium">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {[
                { name: 'Mike Johnson', zone: 'Gate B', task: 'Crowd control', status: 'active', avatar: 'MJ' },
                { name: 'Sarah Williams', zone: 'Medical', task: 'First aid standby', status: 'active', avatar: 'SW' },
                { name: 'Carlos Rodriguez', zone: 'Concourse', task: 'Flow guidance', status: 'break', avatar: 'CR' },
              ].map((s,i) => (
                <tr key={i}><td className="py-3 flex items-center gap-2"><span className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">{s.avatar}</span>{s.name}</td><td className="py-3">{s.zone}</td><td className="py-3">{s.task}</td><td className="py-3"><span className={`px-2 py-1 rounded-full text-xs border ${s.status==='active' ? 'bg-green-500/10 text-green-600 border-green-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>{s.status}</span></td><td className="py-3"><Button size="sm" variant="ghost">Message</Button></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
