import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Events() {
  const [filter, setFilter] = useState('all');
  const events = [
    { id: '1', name: 'FIFA World Cup 2026 - Group A: USA vs Mexico', home: 'USA', away: 'Mexico', group: 'Group A', time: '2026-06-11 20:00', stadium: 'MetLife Stadium', expected: 80000, actual: 0, status: 'scheduled', round: 'Group Stage' },
    { id: '2', name: 'Group B: England vs Germany', home: 'England', away: 'Germany', group: 'Group B', time: '2026-06-12 19:00', stadium: 'MetLife Stadium', expected: 80000, actual: 0, status: 'scheduled', round: 'Group Stage' },
    { id: '3', name: 'Quarter Final', home: 'TBD', away: 'TBD', group: 'Knockout', time: '2026-07-04 20:00', stadium: 'MetLife Stadium', expected: 82500, actual: 0, status: 'scheduled', round: 'Quarter Final' },
    { id: '4', name: 'Semi Final', home: 'TBD', away: 'TBD', group: 'Knockout', time: '2026-07-08 20:00', stadium: 'SoFi Stadium', expected: 70000, actual: 0, status: 'scheduled', round: 'Semi Final' },
  ];

  const filtered = filter === 'all' ? events : events.filter(e => e.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Event Management</h1><p className="text-sm text-slate-500">Match scheduling • Attendance tracking • Venue coordination</p></div>
        <div className="flex gap-2"><Button variant="secondary">Import FIFA Calendar</Button><Button>+ New Event</Button></div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[
          { key: 'all', label: 'All Events' },
          { key: 'live', label: '🔴 Live' },
          { key: 'scheduled', label: 'Scheduled' },
          { key: 'completed', label: 'Completed' },
        ].map(f => <button key={f.key} onClick={() => setFilter(f.key)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border ${filter===f.key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{f.label}</button>)}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(ev => (
          <Card key={ev.id} className="hover:shadow-lg transition-shadow" padding={false}>
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">⚽</div><div><p className="text-xs text-slate-500 uppercase tracking-wide">{ev.round} • {ev.group}</p><p className="font-bold text-slate-900 dark:text-white">{ev.home} vs {ev.away}</p></div></div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${ev.status==='live' ? 'bg-red-500/10 text-red-600 border-red-500/20 animate-pulse' : ev.status==='scheduled' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>{ev.status}</span>
              </div>
              <h3 className="font-medium text-sm text-slate-900 dark:text-white mb-3">{ev.name}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">Stadium</span><span className="font-medium">{ev.stadium}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Kickoff</span><span className="font-medium">{new Date(ev.time).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Expected</span><span className="font-medium">{ev.expected.toLocaleString()} fans</span></div>
              </div>
              <div className="mt-4 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(ev.actual/ev.expected*100) || Math.random()*80}%` }}></div></div>
            </div>
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700 flex gap-2">
              <Button size="sm" variant="ghost" className="flex-1">View Details</Button>
              <Button size="sm" variant="secondary" className="flex-1">Manage Zones</Button>
            </div>
          </Card>
        ))}
      </div>

      <Card title="Tournament Progress" subtitle="FIFA World Cup 2026 journey">
        <div className="relative">
          <div className="flex justify-between">
            {['Group Stage','Round of 16','Quarter Finals','Semi Finals','Final'].map((stage, i) => (
              <div key={stage} className="text-center flex-1">
                <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center text-sm font-bold border-2 ${i===0 ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-500'}`}>{i+1}</div>
                <p className="text-xs mt-2 font-medium">{stage}</p>
                <p className="text-[10px] text-slate-500">{i===0 ? '48 matches' : i===1 ? '16 matches' : i===2 ? '8 matches' : i===3 ? '4 matches' : '2 matches'}</p>
              </div>
            ))}
          </div>
          <div className="absolute top-5 left-10 right-10 h-0.5 bg-slate-200 dark:bg-slate-700 -z-10"></div>
        </div>
      </Card>
    </div>
  );
}
