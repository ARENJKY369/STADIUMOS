import React, { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';
import Card, { StatCard } from '../components/common/Card';
import { mockData } from '../services/api';
import { useSocket } from '../hooks/useSocket';

export default function Dashboard() {
  const [metrics, setMetrics] = useState(mockData.crowdMetrics);
  const [activeTab, setActiveTab] = useState('live');
  const { connected } = useSocket('1');

  const chartData = [
    { time: '10:00', density: 45, occupancy: 1200 },
    { time: '11:00', density: 62, occupancy: 3400 },
    { time: '12:00', density: 78, occupancy: 5200 },
    { time: '13:00', density: 85, occupancy: 6800 },
    { time: '14:00', density: 92, occupancy: 7200 },
    { time: '15:00', density: 88, occupancy: 6900 },
    { time: '16:00', density: 75, occupancy: 5800 },
  ];

  const zoneData = [
    { name: 'Gate A', occupancy: 3200, capacity: 5000, percent: 64 },
    { name: 'Gate B', occupancy: 4100, capacity: 5000, percent: 82 },
    { name: 'Lower East', occupancy: 14200, capacity: 15000, percent: 94 },
    { name: 'Upper North', occupancy: 16800, capacity: 20000, percent: 84 },
    { name: 'Concourse', occupancy: 7400, capacity: 10000, percent: 74 },
  ];

  const incidentPie = [
    { name: 'Medical', value: 4, color: '#ef4444' },
    { name: 'Security', value: 3, color: '#f59e0b' },
    { name: 'Crowd', value: 5, color: '#3b82f6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Live Operations Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            {connected ? 'Real-time connected • Socket.IO live updates' : 'Offline mode • Mock data'} • MetLife Stadium • 62,340 fans
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('live')} className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab==='live' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border'}`}>Live View</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-4 py-2 rounded-xl text-sm font-medium ${activeTab==='analytics' ? 'bg-blue-600 text-white' : 'bg-white dark:bg-slate-800 border'}`}>Analytics</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Occupancy" value="62,340 / 82,500" change="75.5% filled" trend="up" icon="🏟️" color="blue" />
        <StatCard label="Avg Density" value="72%" change="High at Gate B" icon="📊" color="amber" />
        <StatCard label="Incidents Active" value="3" change="2 critical" icon="🚨" color="red" />
        <StatCard label="Staff On Duty" value="145" change="12 zones covered" icon="👮" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Crowd Density Timeline" subtitle="Last 6 hours • Updates every 30s" className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="density" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} strokeWidth={2} name="Density %" />
                <Area type="monotone" dataKey="occupancy" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} name="Occupancy count /100" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Incident Breakdown" subtitle="By type today">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={incidentPie} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value">
                  {incidentPie.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {incidentPie.map(i => <div key={i.name} className="text-center"><div className="w-3 h-3 rounded-full mx-auto mb-1" style={{ backgroundColor: i.color }}></div><p className="text-xs text-slate-600 dark:text-slate-400">{i.name}: {i.value}</p></div>)}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Zone Occupancy Status" subtitle="Real-time with risk levels">
          <div className="space-y-3">
            {zoneData.map(zone => (
              <div key={zone.name} className="space-y-1.5">
                <div className="flex justify-between text-sm"><span className="font-medium text-slate-900 dark:text-white">{zone.name}</span><span className="text-slate-500">{zone.occupancy.toLocaleString()} / {zone.capacity.toLocaleString()} ({zone.percent}%)</span></div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                  <div className={`h-2.5 rounded-full ${zone.percent >= 90 ? 'bg-red-500' : zone.percent >= 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${zone.percent}%` }}></div>
                </div>
                <div className="flex gap-1">{zone.percent >= 90 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 border border-red-500/20">Critical - Redirect</span>}{zone.percent >=80 && zone.percent <90 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">High - Monitor</span>}</div>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Live Crowd Feed" subtitle="Latest sensor readings">
          <div className="space-y-2 max-h-80 overflow-y-auto pr-2">
            {metrics.slice(0,8).map(m => (
              <div key={m.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                <div className="flex items-center gap-2"><span className={`w-2 h-2 rounded-full ${m.density > 80 ? 'bg-red-500' : m.density > 60 ? 'bg-amber-500' : 'bg-green-500'}`}></span><span className="text-sm font-medium">{m.zone_name}</span><span className="text-xs text-slate-500">{new Date(m.timestamp).toLocaleTimeString()}</span></div>
                <div className="flex items-center gap-3 text-xs"><span>{m.density}% density</span><span>{m.occupancy_count} people</span><span className={`px-1.5 py-0.5 rounded ${m.risk_score > 0.7 ? 'bg-red-500/20 text-red-600' : 'bg-green-500/20 text-green-600'}`}>{(m.risk_score*100).toFixed(0)}% risk</span></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card title="AI Predictions" subtitle="ML engine forecast next 30 minutes">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border border-blue-500/20"><p className="text-xs text-blue-600 dark:text-blue-300 font-medium">Predicted Peak</p><p className="text-xl font-bold text-slate-900 dark:text-white mt-1">14:30 - Gate B</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">94% occupancy forecasted - recommend staff reallocation</p></div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20"><p className="text-xs text-amber-600 dark:text-amber-300 font-medium">Incident Risk</p><p className="text-xl font-bold text-slate-900 dark:text-white mt-1">Medium (42%)</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Crowd sentiment stable, no anomaly detected</p></div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20"><p className="text-xs text-green-600 dark:text-green-300 font-medium">Flow Recommendation</p><p className="text-xl font-bold text-slate-900 dark:text-white mt-1">Open Gate C</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Reduces pressure by 18% in 10 minutes</p></div>
        </div>
      </Card>
    </div>
  );
}
