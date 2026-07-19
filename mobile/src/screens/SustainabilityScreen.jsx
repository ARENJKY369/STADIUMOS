import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';

export default function SustainabilityScreen() {
  const { stadium, showToast } = useAppContext();
  const [leaderboard, setLeaderboard] = useState([]);
  const [myStats, setMyStats] = useState({ total_points: 1240, total_carbon: 342, total_distance: 42 });
  const [transportMode, setTransportMode] = useState('bus');
  const [distance, setDistance] = useState(10);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const res = await api.getLeaderboard(stadium.id);
      setLeaderboard(res.data || mockLeaderboard);
    } catch {
      setLeaderboard(mockLeaderboard);
    }
  };

  const calculate = () => {
    const factors = { car: 0.12, bus: 0.05, train: 0.03, bicycle: 0, walking: 0, rideshare: 0.10 };
    const car = distance * 0.12;
    const chosen = distance * (factors[transportMode] || 0.12);
    const saved = car - chosen;
    const pointsMap = { walking: 100, bicycle: 80, bus: 50, train: 60, car: 10, rideshare: 20 };
    const points = (pointsMap[transportMode] || 10) + Math.floor(saved * 10);
    return { car, chosen, saved, points };
  };

  const impact = calculate();

  const logTransport = async () => {
    try {
      await api.logSustainability({
        stadiumId: stadium.id,
        category: 'transport',
        metricName: `${transportMode} travel`,
        value: distance,
        unit: 'km',
        transportMode,
        distanceKm: distance,
      });
      showToast(`Logged! +${impact.points} eco-points 🌱`, 'success');
      setMyStats(prev => ({ ...prev, total_points: prev.total_points + impact.points, total_carbon: prev.total_carbon + impact.saved }));
    } catch {
      showToast(`Logged (offline) +${impact.points} points`, 'info');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🌱 Sustainability Hub</Text>
        <Text style={styles.subtitle}>FIFA World Cup 2026 • Carbon-neutral goal • 16 host cities</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}><Text style={styles.heroValue}>{myStats.total_carbon}kg</Text><Text style={styles.heroLabel}>CO₂ Saved by You</Text></View>
          <View style={styles.heroStat}><Text style={styles.heroValue}>{myStats.total_points}</Text><Text style={styles.heroLabel}>Eco Points</Text></View>
          <View style={styles.heroStat}><Text style={styles.heroValue}>16</Text><Text style={styles.heroLabel}>Trees Equivalent 🌳</Text></View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Calculate Your Impact</Text>
        <Text style={styles.sectionDesc}>Choose transport mode and distance to stadium</Text>
        <View style={styles.modeGrid}>
          {[
            { id: 'walking', icon: '🚶', label: 'Walking\n100 pts' },
            { id: 'bicycle', icon: '🚲', label: 'Bike\n80 pts' },
            { id: 'bus', icon: '🚌', label: 'Bus\n50 pts' },
            { id: 'train', icon: '🚆', label: 'Train\n60 pts' },
            { id: 'car', icon: '🚗', label: 'Car\n10 pts' },
            { id: 'rideshare', icon: '🚕', label: 'Rideshare\n20 pts' },
          ].map(m => (
            <TouchableOpacity key={m.id} style={[styles.modeCard, transportMode === m.id && styles.modeActive]} onPress={() => setTransportMode(m.id)}>
              <Text style={styles.modeIcon}>{m.icon}</Text><Text style={styles.modeLabel}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.distanceRow}>
          <Text style={styles.distanceLabel}>Distance: {distance} km</Text>
          <View style={styles.sliderRow}>
            <TouchableOpacity style={styles.sliderBtn} onPress={() => setDistance(Math.max(1, distance - 1))}><Text style={styles.sliderBtnText}>-</Text></TouchableOpacity>
            <View style={styles.sliderTrack}><View style={[styles.sliderFill, { width: `${(distance / 50) * 100}%` }]} /></View>
            <TouchableOpacity style={styles.sliderBtn} onPress={() => setDistance(Math.min(50, distance + 1))}><Text style={styles.sliderBtnText}>+</Text></TouchableOpacity>
          </View>
        </View>

        <View style={styles.impactGrid}>
          <View style={styles.impactCard}><Text style={styles.impactLabel}>Your Footprint</Text><Text style={styles.impactValue}>{impact.chosen.toFixed(2)} kg CO₂</Text></View>
          <View style={[styles.impactCard, { backgroundColor: '#064e3b' }]}><Text style={[styles.impactLabel, { color: '#6ee7b7' }]}>CO₂ Saved</Text><Text style={[styles.impactValue, { color: '#a7f3d0' }]}>{impact.saved.toFixed(2)} kg</Text></View>
          <View style={[styles.impactCard, { backgroundColor: '#1e3a8a' }]}><Text style={[styles.impactLabel, { color: '#93c5fd' }]}>Eco Points</Text><Text style={[styles.impactValue, { color: '#bfdbfe' }]}>+{impact.points}</Text></View>
        </View>

        <TouchableOpacity style={styles.logBtn} onPress={logTransport}><Text style={styles.logText}>🌱 Log This Trip & Earn {impact.points} Points</Text></TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Leaderboard • {stadium.name}</Text>
        {leaderboard.map(entry => (
          <View key={entry.id} style={[styles.leaderRow, entry.first_name === 'You' && styles.leaderYou]}>
            <View style={[styles.rankBadge, entry.rank === 1 ? { backgroundColor: '#f59e0b' } : entry.rank === 2 ? { backgroundColor: '#94a3b8' } : entry.rank === 3 ? { backgroundColor: '#b45309' } : { backgroundColor: '#334155' }]}><Text style={styles.rankText}>{entry.rank}</Text></View>
            <View style={{ flex: 1, marginLeft: 12 }}><Text style={styles.leaderName}>{entry.first_name} {entry.last_name}</Text><Text style={styles.leaderSub}>{entry.total_actions || Math.floor(entry.total_points / 50)} actions • {entry.total_carbon || 200}kg saved</Text></View>
            <Text style={styles.leaderPoints}>{entry.total_points} pts</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rewards & Badges</Text>
        <View style={styles.rewardsGrid}>
          {[
            { name: 'Eco Fan', pts: 100, icon: '🌱', unlocked: true },
            { name: 'Green Commuter', pts: 500, icon: '🚌', unlocked: true },
            { name: 'Carbon Saver', pts: 1000, icon: '🌍', unlocked: true },
            { name: 'Champion', pts: 5000, icon: '🏆', unlocked: false },
          ].map(r => (
            <View key={r.name} style={[styles.rewardCard, !r.unlocked && { opacity: 0.5 }]}>
              <Text style={styles.rewardIcon}>{r.icon}</Text><Text style={styles.rewardName}>{r.name}</Text><Text style={styles.rewardPts}>{r.pts} pts {r.unlocked ? '✓' : '🔒'}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const mockLeaderboard = [
  { id: '1', first_name: 'Alex', last_name: 'Green', total_points: 2450, rank: 1, total_actions: 42, total_carbon: 520 },
  { id: '2', first_name: 'Sam', last_name: 'Eco', total_points: 1980, rank: 2, total_actions: 38, total_carbon: 410 },
  { id: '3', first_name: 'Jordan', last_name: 'Leaf', total_points: 1720, rank: 3, total_actions: 30, total_carbon: 380 },
  { id: '12', first_name: 'You', last_name: '', total_points: 1240, rank: 12, total_actions: 18, total_carbon: 342 },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { backgroundColor: '#064e3b', borderRadius: 20, padding: 20, marginTop: 50, marginBottom: 20, borderWidth: 1, borderColor: '#10b981' },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#6ee7b7', fontSize: 11, marginTop: 4 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  heroStat: { alignItems: 'center' },
  heroValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  heroLabel: { color: '#6ee7b7', fontSize: 9, marginTop: 2, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  sectionDesc: { color: '#64748b', fontSize: 11, marginTop: 2, marginBottom: 12 },
  modeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  modeCard: { width: '31%', backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, alignItems: 'center' },
  modeActive: { backgroundColor: '#2563eb', borderColor: '#3b82f6' },
  modeIcon: { fontSize: 20 },
  modeLabel: { color: '#fff', fontSize: 9, marginTop: 4, textAlign: 'center', lineHeight: 12 },
  distanceRow: { marginTop: 16, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#334155' },
  distanceLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  sliderBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  sliderBtnText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  sliderTrack: { flex: 1, height: 6, backgroundColor: '#334155', borderRadius: 3, overflow: 'hidden' },
  sliderFill: { height: 6, backgroundColor: '#10b981', borderRadius: 3 },
  impactGrid: { flexDirection: 'row', gap: 8, marginTop: 16 },
  impactCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  impactLabel: { color: '#64748b', fontSize: 9 },
  impactValue: { color: '#fff', fontSize: 13, fontWeight: 'bold', marginTop: 4 },
  logBtn: { backgroundColor: '#10b981', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16 },
  logText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  leaderRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  leaderYou: { backgroundColor: '#1e3a8a', borderColor: '#3b82f6' },
  rankBadge: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  rankText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  leaderName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  leaderSub: { color: '#64748b', fontSize: 10, marginTop: 2 },
  leaderPoints: { color: '#10b981', fontSize: 13, fontWeight: 'bold' },
  rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  rewardCard: { width: '48%', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  rewardIcon: { fontSize: 24 },
  rewardName: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 6 },
  rewardPts: { color: '#94a3b8', fontSize: 10, marginTop: 2 },
});
