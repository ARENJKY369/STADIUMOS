import React, { useState } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Staff() {
  const staff = [
    { id: '1', name: 'John Manager', role: 'manager', dept: 'Operations', status: 'on_duty', zone: 'Control Center', rating: 4.9, avatar: 'JM' },
    { id: '2', name: 'Mike Johnson', role: 'security', dept: 'Security', status: 'on_duty', zone: 'Gate B', rating: 4.8, avatar: 'MJ' },
    { id: '3', name: 'Sarah Williams', role: 'medical', dept: 'Medical', status: 'on_duty', zone: 'Medical Center', rating: 5.0, avatar: 'SW' },
    { id: '4', name: 'Carlos Rodriguez', role: 'staff', dept: 'Guest Services', status: 'break', zone: 'Concourse', rating: 4.7, avatar: 'CR' },
    { id: '5', name: 'Emily Chen', role: 'staff', dept: 'Concessions', status: 'off_duty', zone: 'Food Court', rating: 4.6, avatar: 'EC' },
  ];

  const [selectedDept, setSelectedDept] = useState('all');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Staff Management</h1><p className="text-sm text-slate-500">Team coordination • Shifts • Performance tracking</p></div>
        <div className="flex gap-2"><Button variant="secondary">Import Roster</Button><Button>+ Add Staff</Button></div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'Total Staff', value: '342', icon: '👥', color: 'blue' },
          { label: 'On Duty', value: '145', icon: '✅', color: 'green' },
          { label: 'On Break', value: '23', icon: '☕', color: 'amber' },
          { label: 'Off Duty', value: '174', icon: '💤', color: 'slate' },
          { label: 'Avg Rating', value: '4.8', icon: '⭐', color: 'purple' },
        ].map(s => (
          <Card key={s.label} className="text-center"><p className="text-2xl">{s.icon}</p><p className="font-bold text-xl mt-1">{s.value}</p><p className="text-xs text-slate-500">{s.label}</p></Card>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {['all','Operations','Security','Medical','Guest Services','Concessions'].map(d => <button key={d} onClick={() => setSelectedDept(d)} className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap border ${selectedDept===d ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800'}`}>{d}</button>)}
      </div>

      <Card title="Staff Directory" subtitle={`${staff.length} team members • Real-time location tracking`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs text-slate-500 border-b"><th className="pb-3 font-medium">Member</th><th className="pb-3 font-medium">Department</th><th className="pb-3 font-medium">Zone</th><th className="pb-3 font-medium">Status</th><th className="pb-3 font-medium">Rating</th><th className="pb-3 font-medium">Actions</th></tr></thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {staff.filter(s => selectedDept==='all' || s.dept===selectedDept).map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="py-3 flex items-center gap-3"><div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium text-xs">{s.avatar}</div><div><p className="font-medium">{s.name}</p><p className="text-xs text-slate-500 capitalize">{s.role}</p></div></td>
                  <td className="py-3">{s.dept}</td>
                  <td className="py-3 flex items-center gap-1.5"><span className="w-2 h-2 bg-green-500 rounded-full"></span>{s.zone}</td>
                  <td className="py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${s.status==='on_duty' ? 'bg-green-500/10 text-green-600 border-green-500/20' : s.status==='break' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{s.status.replace('_',' ')}</span></td>
                  <td className="py-3"><span className="flex items-center gap-1">⭐ {s.rating}</span></td>
                  <td className="py-3 flex gap-1"><Button size="sm" variant="ghost">View</Button><Button size="sm" variant="secondary">Message</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Shift Schedule" subtitle="Today's assignments">
          <div className="space-y-3">
            {[
              { time: '08:00 - 16:00', task: 'Gate A crowd management', staff: 'Mike Johnson', zone: 'Gate A' },
              { time: '12:00 - 20:00', task: 'Medical standby', staff: 'Sarah Williams', zone: 'Medical' },
              { time: '14:00 - 22:00', task: 'VIP lounge support', staff: 'Emily Chen', zone: 'VIP-3' },
            ].map((sh,i) => <div key={i} className="flex gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-700"><div className="text-xs font-mono bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 h-fit">{sh.time}</div><div><p className="font-medium text-sm">{sh.task}</p><p className="text-xs text-slate-500">{sh.staff} • {sh.zone}</p></div></div>)}
          </div>
        </Card>
        <Card title="Performance Metrics" subtitle="Staff efficiency and response">
          <div className="space-y-4">
            <div><div className="flex justify-between text-sm mb-1"><span>Task Completion</span><span className="font-bold">94%</span></div><div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-blue-600 h-2 rounded-full w-[94%]"></div></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span>Avg Response Time</span><span className="font-bold">2.4 min</span></div><div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-green-600 h-2 rounded-full w-[88%]"></div></div></div>
            <div><div className="flex justify-between text-sm mb-1"><span>Fan Feedback</span><span className="font-bold">4.8/5</span></div><div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-purple-600 h-2 rounded-full w-[96%]"></div></div></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
