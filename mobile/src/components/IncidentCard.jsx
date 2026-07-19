import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function IncidentCard({ incident, onAcknowledge, onResolve }) {
  const severityColor = {
    critical: '#ef4444', high: '#f59e0b', medium: '#3b82f6', low: '#10b981',
  }[incident.severity] || '#64748b';

  return (
    <View style={[styles.card, { borderLeftColor: severityColor }]}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: severityColor }]} />
        <Text style={styles.title}>{incident.title}</Text>
        <Text style={styles.time}>{new Date(incident.created_at).toLocaleTimeString()}</Text>
      </View>
      <Text style={styles.meta}>{incident.zone_name} • {incident.type} • {incident.severity.toUpperCase()}</Text>
      <Text style={styles.desc}>{incident.description || 'No description'}</Text>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btn} onPress={() => onAcknowledge?.(incident)}><Text style={styles.btnText}>Acknowledge</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563eb' }]} onPress={() => onResolve?.(incident)}><Text style={[styles.btnText, { color: '#fff' }]}>Resolve</Text></TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 10, borderLeftWidth: 4, borderWidth: 1, borderColor: '#334155' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  title: { color: '#fff', fontSize: 13, fontWeight: 'bold', flex: 1 },
  time: { color: '#64748b', fontSize: 10 },
  meta: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  desc: { color: '#cbd5e1', fontSize: 11, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { flex: 1, backgroundColor: '#334155', padding: 8, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
});
