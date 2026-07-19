import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Loading({ message = 'Loading StadiumOS...', size = 'large' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#2563eb" />
      <Text style={styles.text}>{message}</Text>
      <Text style={styles.sub}>FIFA World Cup 2026 Operations</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center', padding: 20 },
  text: { color: '#fff', marginTop: 16, fontSize: 16, fontWeight: 'bold' },
  sub: { color: '#64748b', fontSize: 12, marginTop: 4 },
});
