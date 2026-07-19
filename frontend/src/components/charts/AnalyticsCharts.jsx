import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function CrowdDensityChart({ data }) {
  const chartData = data || [
    { time: '10:00', GateA: 45, GateB: 62, LowerEast: 78 },
    { time: '11:00', GateA: 52, GateB: 71, LowerEast: 82 },
    { time: '12:00', GateA: 68, GateB: 85, LowerEast: 88 },
    { time: '13:00', GateA: 75, GateB: 92, LowerEast: 91 },
    { time: '14:00', GateA: 72, GateB: 88, LowerEast: 89 },
  ];
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
        <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
        <YAxis stroke="#64748b" fontSize={12} />
        <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff' }} />
        <Legend />
        <Line type="monotone" dataKey="GateA" stroke="#3b82f6" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="GateB" stroke="#f59e0b" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="LowerEast" stroke="#10b981" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function IncidentBarChart({ data }) {
  const chartData = data || [
    { type: 'Medical', count: 4, color: '#ef4444' },
    { type: 'Security', count: 3, color: '#f59e0b' },
    { type: 'Crowd', count: 5, color: '#3b82f6' },
    { type: 'Technical', count: 2, color: '#8b5cf6' },
  ];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="type" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Bar dataKey="count" fill="#3b82f6" radius={[8,8,0,0]}>
          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function TransportPieChart({ data }) {
  const chartData = data || [
    { name: 'Bus', value: 45, color: '#3b82f6' },
    { name: 'Train', value: 25, color: '#10b981' },
    { name: 'Car', value: 15, color: '#f59e0b' },
    { name: 'Bike', value: 10, color: '#8b5cf6' },
    { name: 'Walk', value: 5, color: '#ec4899' },
  ];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <PieChart>
        <Pie data={chartData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label>
          {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function SustainabilityChart({ data }) {
  const chartData = data || [
    { date: 'Mon', carbon: 120, points: 320 },
    { date: 'Tue', carbon: 150, points: 420 },
    { date: 'Wed', carbon: 110, points: 380 },
    { date: 'Thu', carbon: 180, points: 520 },
    { date: 'Fri', carbon: 200, points: 610 },
  ];
  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
        <XAxis dataKey="date" fontSize={12} />
        <YAxis fontSize={12} />
        <Tooltip />
        <Bar dataKey="carbon" fill="#10b981" name="CO₂ Saved kg" radius={[4,4,0,0]} />
        <Bar dataKey="points" fill="#3b82f6" name="Eco Points" radius={[4,4,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
