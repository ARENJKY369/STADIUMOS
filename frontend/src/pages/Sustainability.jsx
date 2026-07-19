import React, { useState, useEffect } from 'react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import EcoTracker from '../components/sustainability/EcoTracker';
import api from '../services/api';

export default function Sustainability() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const lb = await api.get('/sustainability/leaderboard/1?limit=10');
        setLeaderboard(lb.data.data);
        const stats = await api.get('/sustainability/my-stats');
        setMyStats(stats.data.data);
        const rep = await api.get('/sustainability/report/1');
        setReport(rep.data.data);
      } catch {
        setLeaderboard([
          { id: '1', first_name: 'Alex', last_name: 'Green', total_points: 2450, rank: 1 },
          { id: '2', first_name: 'Sam', last_name: 'Eco', total_points: 1980, rank: 2 },
          { id: '3', first_name: 'Jordan', last_name: 'Leaf', total_points: 1720, rank: 3 },
        ]);
        setMyStats({ totals: { total_points: 1240, total_carbon: 342, total_distance: 42 } });
        setReport({ totalCarbon: 1240, savings: 3760, savingsPercent: 75, equivalent: { trees: 16, carKm: 1780 } });
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-green-600 via-emerald-600 to-teal-700 p-8 text-white">
        <div className="relative">
          <h1 className="text-3xl font-black">🌱 Sustainability Hub</h1>
          <p className="text-green-100 mt-2 max-w-2xl">Track carbon footprint, earn eco-points, compete on leaderboards. FIFA World Cup 2026 aims for carbon-neutral tournament across 16 host cities.</p>
          <div className="mt-6 grid grid-cols-3 gap-4 max-w-lg">
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20"><p className="text-xs text-green-100">CO₂ Saved Stadium</p><p className="text-xl font-bold">{report?.totalCarbon || 1240} kg today</p></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20"><p className="text-xs text-green-100">Your Contribution</p><p className="text-xl font-bold">{myStats?.totals?.total_carbon || 342} kg</p></div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-3 border border-white/20"><p className="text-xs text-green-100">Trees Equivalent</p><p className="text-xl font-bold">🌳 {report?.equivalent?.trees || 16}</p></div>
          </div>
        </div>
      </div>

      <EcoTracker leaderboard={leaderboard} userStats={myStats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Rewards & Achievements" subtitle="Unlock badges">
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Eco Fan', points: 100, unlocked: true, icon: '🌱' },
              { name: 'Green Commuter', points: 500, unlocked: true, icon: '🚌' },
              { name: 'Carbon Saver', points: 1000, unlocked: true, icon: '🌍' },
              { name: 'Champion', points: 5000, unlocked: false, icon: '🏆' },
            ].map(r => (
              <div key={r.name} className={`p-3 rounded-xl border text-center ${r.unlocked ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 opacity-60'}`}>
                <p className="text-xl">{r.icon}</p><p className="font-medium text-sm mt-1">{r.name}</p><p className="text-xs text-slate-500">{r.points} pts {r.unlocked ? '✓' : ''}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Sustainable Transport Options" subtitle="Low-carbon ways to stadium">
          <div className="space-y-3">
            {[
              { mode: 'Public Bus', saving: '12 kg CO₂ vs car, 50 pts', time: '25 min', icon: '🚌', recommended: true },
              { mode: 'Metro/Subway', saving: '10 kg, 55 pts', time: '20 min', icon: '🚆', recommended: true },
              { mode: 'Bicycle', saving: '15 kg, 80 pts', time: '30 min', icon: '🚲', recommended: true },
              { mode: 'Walking', saving: '15 kg, 100 pts', time: '45 min', icon: '🚶', recommended: false },
            ].map(opt => (
              <div key={opt.mode} className={`p-3 rounded-xl border flex items-center justify-between ${opt.recommended ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-3"><span className="text-xl">{opt.icon}</span><div><p className="font-medium text-sm">{opt.mode} {opt.recommended && '⭐ Recommended'}</p><p className="text-xs text-slate-500">{opt.saving} • {opt.time}</p></div></div>
                <Button size="sm" variant={opt.recommended ? 'primary' : 'secondary'}>Select</Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
