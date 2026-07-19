import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useCrowdContext } from '../context/CrowdContext';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import realtime from '../services/realtime';

export default function DashboardScreen() {
  const { zones, crowdData } = useCrowdContext();
  const { stadium, showToast } = useAppContext();
  const [incidents, setIncidents] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('crowd');

  useEffect(() => {
    fetchIncidents();
    const unsub = realtime.on('incident_created', (data) => {
      setIncidents(prev => [data, ...prev.slice(0,9)]);
      showToast(`New incident: ${data.title}`, 'warning');
    });
    return () => unsub();
  }, []);

  const fetchIncidents = async () => {
    try {
      const res = await api.getIncidents(stadium.id);
      setIncidents(res.data || mockIncidents);
    } catch {
      setIncidents(mockIncidents);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchIncidents();
    setRefreshing(false);
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}><Text style={styles.title}>Live Operations Dashboard</Text><Text style={styles.subtitle}>{stadium.name} • Real-time Socket.IO • {crowdData.length} live metrics</Text></View>

      <View style={styles.tabRow}>
        <TouchableOpacity style={[styles.tab, activeTab==='crowd' && styles.tabActive]} onPress={() => setActiveTab('crowd')}><Text style={styles.tabText}>👥 Crowd</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab==='incidents' && styles.tabActive]} onPress={() => setActiveTab('incidents')}><Text style={styles.tabText}>🚨 Incidents</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.tab, activeTab==='staff' && styles.tabActive]} onPress={() => setActiveTab('staff')}><Text style={styles.tabText}>👮 Staff</Text></TouchableOpacity>
      </View>

      {activeTab === 'crowd' && (
        <>
          <View style={styles.kpiRow}>
            <View style={styles.kpi}><Text style={styles.kpiValue}>{zones.reduce((s,z)=>s+(z.current_occupancy||0),0).toLocaleString()}</Text><Text style={styles.kpiLabel}>Fans Present</Text></View>
            <View style={styles.kpi}><Text style={styles.kpiValue}>72%</Text><Text style={styles.kpiLabel}>Avg Density</Text></View>
            <View style={styles.kpi}><Text style={styles.kpiValue}>3</Text><Text style={styles.kpiLabel}>High Zones</Text></View>
          </View>

          {zones.map(zone => {
            const percent = Math.round((zone.current_occupancy / zone.capacity)*100);
            const risk = percent >=90 ? 'critical' : percent >=80 ? 'high' : percent >=50 ? 'medium' : 'low';
            return (
              <View key={zone.id} style={styles.zoneCard}>
                <View style={styles.zoneHeader}><Text style={styles.zoneName}>{zone.name}</Text><View style={[styles.badge, { backgroundColor: risk==='critical' ? '#ef4444' : risk==='high' ? '#f59e0b' : '#10b981' }]}><Text style={styles.badgeText}>{risk.toUpperCase()}</Text></View></View>
                <View style={styles.zoneStats}><Text style={styles.zoneOcc}>{zone.current_occupancy}/{zone.capacity} ({percent}%)</Text><Text style={styles.zoneType}>{zone.type}</Text></View>
                <View style={styles.bar}><View style={[styles.fill, { width: `${percent}%`, backgroundColor: risk==='critical' ? '#ef4444' : risk==='high' ? '#f59e0b' : '#10b981' }]} /></View>
                <Text style={styles.recommendation}>{risk==='critical' ? '→ Redirect to Gate A: -15% in 8 min' : risk==='high' ? '→ Monitor, open secondary exit' : '→ Flow normal'}</Text>
              </View>
            );
          })}
        </>
      )}

      {activeTab === 'incidents' && (
        <>
          <View style={styles.alertBanner}><Text style={styles.alertTitle}>🚨 {incidents.filter(i=>['reported','in_progress'].includes(i.status)).length} Active Incidents</Text><Text style={styles.alertDesc}>2 critical require immediate response • Avg response 2.4 min</Text></View>
          {incidents.map(inc => (
            <View key={inc.id} style={[styles.incidentCard, inc.severity==='critical' && { borderColor: '#ef4444' }]}>
              <View style={styles.incidentHeader}><View style={[styles.severityDot, { backgroundColor: inc.severity==='critical' ? '#ef4444' : inc.severity==='high' ? '#f59e0b' : '#3b82f6' }]} /><Text style={styles.incidentTitle}>{inc.title}</Text><Text style={styles.incidentTime}>{new Date(inc.created_at).toLocaleTimeString()}</Text></View>
              <Text style={styles.incidentZone}>{inc.zone_name || inc.zone_id} • {inc.type} • {inc.severity}</Text>
              <View style={styles.incidentActions}><TouchableOpacity style={styles.actionBtn}><Text style={styles.actionText}>Acknowledge</Text></TouchableOpacity><TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563eb' }]}><Text style={[styles.actionText, {color:'#fff'}]}>Resolve</Text></TouchableOpacity></View>
            </View>
          ))}
        </>
      )}

      {activeTab === 'staff' && (
        <>
          <View style={styles.staffSummary}><Text style={styles.staffSummaryTitle}>👮 145 On Duty • 4.8 Avg Rating • 12 Zones Covered</Text></View>
          {[
            { name: 'Mike Johnson', role: 'Security Lead', zone: 'Gate B', status: 'active' },
            { name: 'Sarah Williams', role: 'Medical', zone: 'Medical Center', status: 'active' },
            { name: 'Carlos Rodriguez', role: 'Guest Services', zone: 'Concourse', status: 'break' },
          ].map((s,i) => (
            <View key={i} style={styles.staffCard}><View style={styles.staffAvatar}><Text style={styles.staffAvatarText}>{s.name.split(' ').map(n=>n[0]).join('')}</Text></View><View style={{ flex:1 }}><Text style={styles.staffName}>{s.name}</Text><Text style={styles.staffRole}>{s.role} • {s.zone}</Text></View><View style={[styles.statusBadge, { backgroundColor: s.status==='active' ? '#10b981' : '#f59e0b' }]}><Text style={styles.statusText}>{s.status}</Text></View></View>
          ))}
        </>
      )}

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const mockIncidents = [
  { id: '1', title: 'Medical assistance needed Gate A', type: 'medical', severity: 'high', status: 'reported', created_at: new Date().toISOString(), zone_name: 'Gate A' },
  { id: '2', title: 'Crowding at Concourse', type: 'crowd', severity: 'medium', status: 'in_progress', created_at: new Date(Date.now()-3600000).toISOString(), zone_name: 'Main Concourse' },
  { id: '3', title: 'Suspicious package South B', type: 'security', severity: 'critical', status: 'reported', created_at: new Date(Date.now()-600000).toISOString(), zone_name: 'South Entrance' },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { marginTop: 50, marginBottom: 16 },
  title: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 11, marginTop: 4 },
  tabRow: { flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, marginBottom: 16, gap: 4 },
  tab: { flex: 1, padding: 10, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#2563eb' },
  tabText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  kpiRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  kpi: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  kpiValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  kpiLabel: { color: '#64748b', fontSize: 10, marginTop: 2 },
  zoneCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  zoneHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  zoneName: { color: '#fff', fontWeight: 'bold', fontSize: 13, flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  zoneStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  zoneOcc: { color: '#cbd5e1', fontSize: 11 },
  zoneType: { color: '#64748b', fontSize: 10, textTransform: 'uppercase' },
  bar: { height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 8 },
  fill: { height: 4, borderRadius: 2 },
  recommendation: { color: '#60a5fa', fontSize: 10, marginTop: 8, fontStyle: 'italic' },
  alertBanner: { backgroundColor: '#7f1d1d', borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#ef4444' },
  alertTitle: { color: '#fecaca', fontWeight: 'bold', fontSize: 13 },
  alertDesc: { color: '#fca5a5', fontSize: 11, marginTop: 4 },
  incidentCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#334155' },
  incidentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  severityDot: { width: 8, height: 8, borderRadius: 4 },
  incidentTitle: { color: '#fff', fontSize: 12, fontWeight: '600', flex: 1 },
  incidentTime: { color: '#64748b', fontSize: 10 },
  incidentZone: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  incidentActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  actionBtn: { flex: 1, backgroundColor: '#334155', padding: 8, borderRadius: 8, alignItems: 'center' },
  actionText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  staffSummary: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 12 },
  staffSummaryTitle: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  staffCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155', gap: 12 },
  staffAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  staffAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  staffName: { color: '#fff', fontSize: 13, fontWeight: '600' },
  staffRole: { color: '#64748b', fontSize: 11, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
});
