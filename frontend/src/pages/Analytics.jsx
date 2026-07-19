import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

export default function Analytics() {
  const [period, setPeriod] = useState('7d');
  const trendData = [
    { date: '06/05', attendance: 42000, incidents: 5, satisfaction: 82 },
    { date: '06/06', attendance: 58000, incidents: 8, satisfaction: 78 },
    { date: '06/07', attendance: 71000, incidents: 12, satisfaction: 85 },
    { date: '06/08', attendance: 82500, incidents: 15, satisfaction: 88 },
    { date: '06/09', attendance: 79000, incidents: 9, satisfaction: 90 },
    { date: '06/10', attendance: 68000, incidents: 6, satisfaction: 87 },
    { date: '06/11', attendance: 80000, incidents: 11, satisfaction: 89 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><h1 className="text-2xl font-bold text-slate-900 dark:text-white">Advanced Analytics</h1><p className="text-sm text-slate-500">Historical trends • Predictive insights • Custom reports</p></div>
        <div className="flex gap-2">
          {['24h','7d','30d','90d'].map(p => <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border ${period===p ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{p}</button>)}
          <Button>Export Report</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Attendance Trend" subtitle={`Last ${period} performance`} className="lg:col-span-2">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px' }} />
                <Area type="monotone" dataKey="attendance" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="KPI Summary" subtitle="Performance indicators">
          <div className="space-y-4">
            {[
              { label: 'Occupancy Rate', value: '89%', change: '+3%', color: 'bg-blue-500' },
              { label: 'Safety Score', value: '97.2%', change: '+0.5%', color: 'bg-green-500' },
              { label: 'Response Time', value: '2.4 min', change: '-12%', color: 'bg-amber-500' },
              { label: 'Fan Satisfaction', value: '88/100', change: '+4%', color: 'bg-purple-500' },
              { label: 'Sustainability', value: '76/100', change: '+8%', color: 'bg-emerald-500' },
            ].map(k => (
              <div key={k.label} className="flex items-center justify-between"><div className="flex items-center gap-2"><div className={`w-2 h-8 rounded-full ${k.color}`}></div><div><p className="text-sm font-medium">{k.label}</p><p className="text-xs text-slate-500">{k.change} vs prev</p></div></div><p className="font-bold">{k.value}</p></div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Incident vs Attendance" subtitle="Correlation analysis">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="incidents" fill="#f59e0b" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="Predictive Insights" subtitle="ML-powered next 24h forecast">
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-200 dark:border-blue-800"><p className="text-sm font-medium">Peak Hours Forecast</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Tomorrow 14:00-16:00 expected 94% occupancy at East Lower. Recommend +4 staff.</p><div className="mt-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5"><div className="bg-blue-500 h-1.5 rounded-full w-4/5"></div></div><p className="text-xs text-slate-500 mt-1">Confidence: 87% • Model v2.1</p></div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"><p className="text-sm font-medium">Sustainability Prediction</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">If 30% use public transport, carbon save 1.2 tons. Current eco-points will reach 15k.</p></div>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800"><p className="text-sm font-medium">Incident Risk</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Low risk next 6 hours. Crowd mood calm, weather clear, sentiment positive.</p></div>
          </div>
        </Card>
      </div>

      <Card title="Custom Reports" subtitle="Generate and download">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: 'Daily Operations Summary', desc: 'Crowd, incidents, staff, revenue', icon: '📊' },
            { title: 'Sustainability Report', desc: 'Carbon footprint, eco-points, transport', icon: '🌱' },
            { title: 'Safety & Compliance', desc: 'Incidents, response times, audits', icon: '🛡️' },
          ].map(r => (
            <div key={r.title} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 hover:shadow-md transition"><p className="text-2xl mb-2">{r.icon}</p><p className="font-medium text-sm">{r.title}</p><p className="text-xs text-slate-500 mt-1">{r.desc}</p><Button size="sm" variant="secondary" className="mt-3 w-full">Generate PDF</Button></div>
          ))}
        </div>
      </Card>
    </div>
  );
}
