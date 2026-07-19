import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Card, { StatCard } from '../components/common/Card';
import Button from '../components/common/Button';
import api, { mockData } from '../services/api';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [liveEvents, setLiveEvents] = useState(mockData.events);
  const [recentIncidents, setRecentIncidents] = useState(mockData.incidents);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/analytics/dashboard/1');
        setStats(res.data.data);
      } catch (e) {
        setStats({
          capacity: { totalCapacity: 82500, currentOccupancy: 62340, occupancyPercent: 75.5, totalZones: 10 },
          incidents: { total: 12, active: 3 },
          crowd: { avg_density: 65, max_density: 92 },
          staff: { staff_on_duty: 145 },
          tickets: { tickets_sold: 80000, entered: 62340 },
        });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 p-8 text-white">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-214f3774381b?w=1200')] opacity-20 bg-cover"></div>
        <div className="relative">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur text-xs font-medium border border-white/20">FIFA World Cup 2026 • Live Operations</span>
            <span className="px-3 py-1 rounded-full bg-green-500/30 text-green-200 border border-green-400/30 text-xs flex items-center gap-1.5"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>All Systems Operational</span>
          </div>
          <h1 className="text-4xl lg:text-5xl font-black tracking-tight mb-3">Stadium Operations<br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">AI Command Center</span></h1>
          <p className="text-lg text-slate-300 max-w-2xl mb-6">Real-time crowd intelligence, incident response, sustainability tracking, and GenAI assistant for 100K+ fans across 16 host cities. Production-ready for the biggest tournament on Earth.</p>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard"><Button size="lg">Open Live Dashboard →</Button></Link>
            <Link to="/operations"><Button variant="secondary" size="lg">View Operations</Button></Link>
          </div>
          <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 max-w-3xl">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-300">Total Capacity</p><p className="text-xl font-bold">82,500</p></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-300">Live Occupancy</p><p className="text-xl font-bold">{stats?.capacity?.currentOccupancy || '62,340'}</p></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-300">Active Staff</p><p className="text-xl font-bold">{stats?.staff?.staff_on_duty || '145'}</p></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/10"><p className="text-xs text-slate-300">Safety Score</p><p className="text-xl font-bold">98.2%</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Occupancy Rate" value={`${stats?.capacity?.occupancyPercent || 75.5}%`} change="+5.2% from yesterday" trend="up" icon="👥" color="blue" />
        <StatCard label="Active Incidents" value={stats?.incidents?.active || 3} change="2 resolved today" trend="down" icon="🚨" color="amber" />
        <StatCard label="Crowd Density" value={`${stats?.crowd?.avg_density || 65}%`} change="Peak: 92% at Gate B" icon="📊" color="green" />
        <StatCard label="Eco Points" value="12,450" change="+340 today" trend="up" icon="🌱" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Live Events Today" subtitle="Scheduled matches and status" className="lg:col-span-2">
          <div className="space-y-3">
            {liveEvents.map(ev => (
              <div key={ev.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold">⚽</div>
                  <div><p className="font-medium text-slate-900 dark:text-white">{ev.home_team} vs {ev.away_team}</p><p className="text-xs text-slate-500">{new Date(ev.start_time).toLocaleString()} • {ev.expected_attendance} fans</p></div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-xs font-medium">{ev.status}</span>
              </div>
            ))}
          </div>
          <div className="mt-4"><Link to="/events" className="text-sm text-blue-600 hover:underline">View all events →</Link></div>
        </Card>

        <Card title="Critical Alerts" subtitle="Requires attention">
          <div className="space-y-3">
            {recentIncidents.map(inc => (
              <div key={inc.id} className={`p-3 rounded-xl border ${inc.severity==='high' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'}`}>
                <div className="flex items-start justify-between"><p className="font-medium text-sm">{inc.title}</p><span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 border">{inc.severity}</span></div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{inc.zone_name} • {new Date(inc.created_at).toLocaleTimeString()}</p>
              </div>
            ))}
          </div>
          <Button variant="ghost" className="w-full mt-4">View Operations Center</Button>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="AI Assistant" subtitle="Claude-powered multilingual support">
          <div className="bg-slate-900 rounded-xl p-4 text-slate-300 text-sm space-y-3">
            <div className="flex gap-2"><span className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">U</span><p className="bg-slate-800 rounded-2xl rounded-tl-sm px-3 py-2">Where is Gate B and is it crowded?</p></div>
            <div className="flex gap-2 justify-end"><span className="order-2 w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-xs">AI</span><p className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-3 py-2">Gate B is South Entrance, currently 82% capacity, moderate queue ~8 min. Alternative: Gate A at 64% with 3 min wait. Would you like navigation?</p></div>
          </div>
          <div className="mt-3 flex gap-2">
            <input placeholder="Ask about navigation, crowd, events..." className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm" />
            <Button>Send</Button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Supports 50+ languages • Real-time translation • Context aware</p>
        </Card>

        <Card title="Sustainability Tracker" subtitle="Carbon footprint & eco-points">
          <div className="space-y-4">
            <div className="flex items-center justify-between"><span className="text-sm">Carbon Saved Today</span><span className="font-bold text-green-600">342 kg CO₂</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full" style={{width:'68%'}}></div></div>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg">🚲</p><p className="text-xs font-medium">120 cyclists</p></div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg">🚌</p><p className="text-xs font-medium">2.3k bus</p></div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg">🚶</p><p className="text-xs font-medium">890 walking</p></div>
            </div>
            <div className="flex gap-2 mt-2">
              <div className="flex-1 p-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-center"><p className="text-xs text-green-700 dark:text-green-300">Your Points</p><p className="font-bold text-green-700 dark:text-green-200">1,240 pts</p></div>
              <div className="flex-1 p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center"><p className="text-xs text-blue-700 dark:text-blue-300">Leaderboard</p><p className="font-bold text-blue-700 dark:text-blue-200">#12 rank</p></div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
