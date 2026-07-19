import React, { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';

export default function EcoTracker({ userStats, leaderboard }) {
  const [transportMode, setTransportMode] = useState('bus');
  const [distance, setDistance] = useState(10);

  const calculateImpact = () => {
    const factors = { car: 0.12, bus: 0.05, train: 0.03, bicycle: 0, walking: 0, rideshare: 0.10 };
    const carFootprint = distance * 0.12;
    const chosenFootprint = distance * (factors[transportMode] || 0.12);
    const saved = carFootprint - chosenFootprint;
    const points = transportMode === 'walking' ? 100 : transportMode === 'bicycle' ? 80 : transportMode === 'bus' ? 50 : 20;
    return { carFootprint, chosenFootprint, saved, points: points + Math.floor(saved * 10) };
  };

  const impact = calculateImpact();

  return (
    <div className="space-y-6">
      <Card title="Carbon Calculator" subtitle="Calculate your eco impact">
        <div className="space-y-4">
          <div><label className="text-xs font-medium">Transport Mode</label><div className="grid grid-cols-3 gap-2 mt-2">{['walking','bicycle','bus','train','car','rideshare'].map(mode => <button key={mode} onClick={() => setTransportMode(mode)} className={`p-2.5 rounded-xl border text-xs font-medium capitalize ${transportMode===mode ? 'bg-blue-600 text-white border-blue-600' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>{mode === 'walking' ? '🚶' : mode === 'bicycle' ? '🚲' : mode === 'bus' ? '🚌' : mode === 'train' ? '🚆' : mode === 'car' ? '🚗' : '🚕'} {mode}</button>)}</div></div>
          <div><label className="text-xs font-medium">Distance (km)</label><input type="range" min="1" max="100" value={distance} onChange={e => setDistance(parseInt(e.target.value))} className="w-full mt-2" /><div className="flex justify-between text-xs text-slate-500"><span>1 km</span><span className="font-bold text-slate-900 dark:text-white">{distance} km</span><span>100 km</span></div></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-center"><p className="text-xs text-slate-500">CO₂ Footprint</p><p className="font-bold">{impact.chosenFootprint.toFixed(2)} kg</p></div>
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-center border border-green-200 dark:border-green-800"><p className="text-xs text-green-600">CO₂ Saved</p><p className="font-bold text-green-700 dark:text-green-300">{impact.saved.toFixed(2)} kg</p></div>
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-center border border-blue-200 dark:border-blue-800"><p className="text-xs text-blue-600">Eco Points</p><p className="font-bold text-blue-700 dark:text-blue-300">+{impact.points}</p></div>
          </div>
          <Button className="w-full">🌱 Log This Trip & Earn Points</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Leaderboard" subtitle="Top eco warriors this week">
          <div className="space-y-2">
            {(leaderboard || [{ id: '1', first_name: 'Alex', last_name: 'Green', total_points: 2450, rank: 1 }, { id: '2', first_name: 'Sam', last_name: 'Eco', total_points: 1980, rank: 2 }, { id: '3', first_name: 'You', last_name: '', total_points: 1240, rank: 12 }]).map(entry => (
              <div key={entry.id} className={`flex items-center justify-between p-2.5 rounded-xl border ${entry.first_name==='You' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-3"><span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${entry.rank===1 ? 'bg-yellow-500 text-white' : entry.rank===2 ? 'bg-slate-400 text-white' : entry.rank===3 ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600'}`}>{entry.rank}</span><span className="text-sm font-medium">{entry.first_name} {entry.last_name}</span></div>
                <span className="text-sm font-bold text-green-600">{entry.total_points} pts</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Your Impact" subtitle="Sustainability stats">
          <div className="space-y-3">
            <div className="flex justify-between text-sm"><span className="text-slate-500">Total CO₂ Saved</span><span className="font-bold text-green-600">342 kg</span></div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2"><div className="bg-green-500 h-2 rounded-full w-[68%]"></div></div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg">🚲</p><p className="font-medium">12 bike trips</p></div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg">🚌</p><p className="font-medium">23 bus</p></div>
              <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50"><p className="text-lg">🚶</p><p className="font-medium">8 walks</p></div>
            </div>
            <div className="p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20"><p className="text-xs font-medium text-green-700 dark:text-green-300">Equivalent to planting 16 trees! 🌳</p><p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Your actions prevent 342kg CO₂ = 1,780 km car travel</p></div>
          </div>
        </Card>
      </div>
    </div>
  );
}
