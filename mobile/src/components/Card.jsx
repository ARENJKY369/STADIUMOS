import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function Card({ children, title, subtitle, onPress, style }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper style={[styles.card, style]} onPress={onPress} activeOpacity={0.7}>
      {(title || subtitle) && (
        <View style={styles.header}>
          {title && <Text style={styles.title}>{title}</Text>}
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
      )}
      <View style={styles.content}>{children}</View>
    </Wrapper>
  );
}

export function StatCard({ label, value, icon, color = '#3b82f6' }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', overflow: 'hidden', marginBottom: 12 },
  header: { padding: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 11, marginTop: 2 },
  content: { padding: 14 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderLeftWidth: 4, borderWidth: 1, borderColor: '#334155', alignItems: 'center', flex: 1 },
  statIcon: { fontSize: 20 },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginTop: 6 },
  statLabel: { color: '#64748b', fontSize: 10, marginTop: 2 },
});
