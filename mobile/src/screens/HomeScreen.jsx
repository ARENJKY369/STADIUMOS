import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Image } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';
import { useCrowdContext } from '../context/CrowdContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuthContext();
  const { stadium, showToast } = useAppContext();
  const { crowdData, zones } = useCrowdContext();
  const [refreshing, setRefreshing] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await api.getEvents({ stadiumId: stadium.id, limit: 3 });
      setEvents(res.data || mockEvents);
    } catch {
      setEvents(mockEvents);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchEvents();
    setRefreshing(false);
    showToast('Refreshed', 'success');
  };

  const totalOccupancy = zones.reduce((sum, z) => sum + (z.current_occupancy || 0), 0);
  const totalCapacity = zones.reduce((sum, z) => sum + (z.capacity || 0), 0);
  const occupancyPercent = totalCapacity ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.first_name || user?.firstName || 'Fan'} 👋</Text>
          <Text style={styles.stadiumInfo}>{stadium.name} • {stadium.city}</Text>
        </View>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')}>
          <Text style={styles.avatarText}>{(user?.first_name?.[0] || user?.firstName?.[0] || 'U').toUpperCase()}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.heroCard}>
        <Text style={styles.heroTitle}>FIFA World Cup 2026</Text>
        <Text style={styles.heroSubtitle}>Live Operations • {totalOccupancy.toLocaleString()} fans in stadium</Text>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}><Text style={styles.heroStatValue}>{occupancyPercent}%</Text><Text style={styles.heroStatLabel}>Occupancy</Text></View>
          <View style={styles.heroStat}><Text style={styles.heroStatValue}>{zones.length}</Text><Text style={styles.heroStatLabel}>Zones</Text></View>
          <View style={styles.heroStat}><Text style={styles.heroStatValue}>98%</Text><Text style={styles.heroStatLabel}>Safety</Text></View>
        </View>
      </View>

      <View style={styles.kpiGrid}>
        <View style={[styles.kpiCard, { backgroundColor: '#dbeafe' }]}><Text style={styles.kpiIcon}>👥</Text><Text style={styles.kpiValue}>{totalOccupancy.toLocaleString()}</Text><Text style={styles.kpiLabel}>Current Fans</Text></View>
        <View style={[styles.kpiCard, { backgroundColor: '#fef3c7' }]}><Text style={styles.kpiIcon}>🚨</Text><Text style={styles.kpiValue}>3</Text><Text style={styles.kpiLabel}>Active Alerts</Text></View>
        <View style={[styles.kpiCard, { backgroundColor: '#d1fae5' }]}><Text style={styles.kpiIcon}>✅</Text><Text style={styles.kpiValue}>145</Text><Text style={styles.kpiLabel}>Staff On Duty</Text></View>
        <View style={[styles.kpiCard, { backgroundColor: '#ede9fe' }]}><Text style={styles.kpiIcon}>🌱</Text><Text style={styles.kpiValue}>1.2k</Text><Text style={styles.kpiLabel}>Eco Points</Text></View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Today's Matches</Text><TouchableOpacity onPress={() => navigation.navigate('Dashboard')}><Text style={styles.seeAll}>See all →</Text></TouchableOpacity></View>
        {events.map(ev => (
          <TouchableOpacity key={ev.id} style={styles.eventCard}>
            <View style={styles.eventHeader}><Text style={styles.eventRound}>{ev.round || 'Group Stage'}</Text><View style={[styles.statusBadge, { backgroundColor: ev.status === 'live' ? '#ef4444' : '#3b82f6' }]}><Text style={styles.statusText}>{ev.status || 'SCHEDULED'}</Text></View></View>
            <Text style={styles.eventName}>{ev.home_team || ev.home} vs {ev.away_team || ev.away}</Text>
            <Text style={styles.eventTime}>{new Date(ev.start_time || ev.time).toLocaleString()} • {stadium.name}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Navigation')}><Text style={styles.quickIcon}>🗺️</Text><Text style={styles.quickLabel}>Navigate</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Chat')}><Text style={styles.quickIcon}>💬</Text><Text style={styles.quickLabel}>AI Assistant</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Dashboard')}><Text style={styles.quickIcon}>📊</Text><Text style={styles.quickLabel}>Live Crowd</Text></TouchableOpacity>
          <TouchableOpacity style={styles.quickCard} onPress={() => navigation.navigate('Accessibility')}><Text style={styles.quickIcon}>♿</Text><Text style={styles.quickLabel}>Accessibility</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Crowd Density</Text>
        {crowdData.slice(0,3).map((m, i) => (
          <View key={i} style={styles.crowdRow}>
            <View style={[styles.dot, { backgroundColor: m.density > 80 ? '#ef4444' : m.density > 60 ? '#f59e0b' : '#10b981' }]} />
            <Text style={styles.crowdZone}>{m.zone_name}</Text>
            <Text style={styles.crowdValue}>{Math.round(m.density)}% • {m.occupancy_count} fans</Text>
          </View>
        ))}
      </View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const mockEvents = [
  { id: '1', home: 'USA', away: 'Mexico', round: 'Group A', time: '2026-06-11T20:00:00Z', status: 'scheduled' },
  { id: '2', home: 'England', away: 'Germany', round: 'Group B', time: '2026-06-12T19:00:00Z', status: 'scheduled' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 40 },
  greeting: { color: '#94a3b8', fontSize: 14 },
  userName: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  stadiumInfo: { color: '#64748b', fontSize: 12, marginTop: 2 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  heroCard: { backgroundColor: '#1e293b', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#334155' },
  heroTitle: { color: '#fff', fontSize: 20, fontWeight: '900' },
  heroSubtitle: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  heroStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  heroStat: { alignItems: 'center' },
  heroStatValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  heroStatLabel: { color: '#64748b', fontSize: 10, marginTop: 2 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  kpiCard: { width: '47%', borderRadius: 16, padding: 16, alignItems: 'center' },
  kpiIcon: { fontSize: 24 },
  kpiValue: { fontSize: 20, fontWeight: 'bold', color: '#0f172a', marginTop: 8 },
  kpiLabel: { fontSize: 11, color: '#475569', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  seeAll: { color: '#3b82f6', fontSize: 12 },
  eventCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  eventHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventRound: { color: '#64748b', fontSize: 10, textTransform: 'uppercase' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  eventName: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  eventTime: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  quickIcon: { fontSize: 28 },
  quickLabel: { color: '#fff', fontSize: 12, fontWeight: '600', marginTop: 8 },
  crowdRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 10 },
  crowdZone: { color: '#fff', fontSize: 13, fontWeight: '500', flex: 1 },
  crowdValue: { color: '#94a3b8', fontSize: 11 },
});
