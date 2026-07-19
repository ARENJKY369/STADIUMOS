import React from 'react';
import Badge from '../common/Badge';
import Button from '../common/Button';

export default function StaffCard({ staff, onMessage, onAssign }) {
  const mock = staff || { id: '1', name: 'Mike Johnson', role: 'security', department: 'Security', zone: 'Gate B', status: 'on_duty', rating: 4.8, avatar: 'MJ', task: 'Crowd control', performance: 94 };

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm">{mock.avatar}</div>
          <div><p className="font-semibold text-sm">{mock.name}</p><p className="text-xs text-slate-500 capitalize">{mock.role} • {mock.department}</p></div>
        </div>
        <Badge variant={mock.status === 'on_duty' ? 'success' : mock.status === 'break' ? 'warning' : 'default'} size="sm">{mock.status.replace('_',' ')}</Badge>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"><p className="text-slate-500">Current Zone</p><p className="font-medium">{mock.zone}</p></div>
        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-700/50"><p className="text-slate-500">Rating</p><p className="font-medium">⭐ {mock.rating} • {mock.performance}% efficiency</p></div>
      </div>
      <div className="mt-3">
        <p className="text-xs text-slate-500">Current Task</p><p className="text-sm font-medium mt-1">{mock.task}</p>
        <div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${mock.performance}%` }}></div></div>
      </div>
      {(onMessage || onAssign) && <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" className="flex-1" onClick={() => onMessage?.(mock)}>Message</Button><Button size="sm" className="flex-1" onClick={() => onAssign?.(mock)}>Assign Task</Button></div>}
    </div>
  );
}

export function StaffGrid({ staffList = [] }) {
  const list = staffList.length ? staffList : [
    { id: '1', name: 'Mike Johnson', role: 'security', department: 'Security', zone: 'Gate B', status: 'on_duty', rating: 4.8, avatar: 'MJ', task: 'Crowd control', performance: 94 },
    { id: '2', name: 'Sarah Williams', role: 'medical', department: 'Medical', zone: 'Medical Center', status: 'on_duty', rating: 5.0, avatar: 'SW', task: 'First aid standby', performance: 98 },
    { id: '3', name: 'Carlos Rodriguez', role: 'staff', department: 'Guest Services', zone: 'Concourse', status: 'break', rating: 4.7, avatar: 'CR', task: 'Flow guidance', performance: 89 },
  ];
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{list.map(s => <StaffCard key={s.id} staff={s} />)}</div>;
}
