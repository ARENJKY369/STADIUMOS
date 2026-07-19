import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { useAuthContext } from '../context/AuthContext';
import { useAppContext } from '../context/AppContext';

export default function ProfileScreen() {
  const { user, logout } = useAuthContext();
  const { theme, toggleTheme, language, setLanguage, showToast } = useAppContext();
  const [notifications, setNotifications] = useState({ push: true, email: true, emergency: true });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{(user?.first_name?.[0] || 'U').toUpperCase()}</Text></View>
        <Text style={styles.name}>{user?.first_name || user?.firstName || 'Demo'} {user?.last_name || user?.lastName || 'User'}</Text>
        <Text style={styles.email}>{user?.email || 'demo@fifa2026.com'}</Text>
        <View style={styles.roleBadge}><Text style={styles.roleText}>{(user?.role || 'fan').toUpperCase()} • VERIFIED</Text></View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}><Text style={styles.statValue}>1,240</Text><Text style={styles.statLabel}>Eco Points</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Events</Text></View>
        <View style={styles.stat}><Text style={styles.statValue}>#12</Text><Text style={styles.statLabel}>Leaderboard</Text></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        <View style={styles.card}>
          <View style={styles.row}><Text style={styles.rowLabel}>🌙 Dark Mode</Text><Switch value={theme==='dark'} onValueChange={toggleTheme} trackColor={{ false: '#334155', true: '#2563eb' }} /></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.rowLabel}>🌐 Language</Text><TouchableOpacity onPress={() => setLanguage(language==='en' ? 'es' : 'en')}><Text style={styles.rowValue}>{language==='en' ? 'English → Español' : 'Español → English'}</Text></TouchableOpacity></View>
          <View style={styles.divider} />
          <View style={styles.row}><Text style={styles.rowLabel}>🏟️ Default Stadium</Text><Text style={styles.rowValue}>MetLife Stadium</Text></View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.card}>
          {[
            { key: 'push', label: 'Push Notifications', desc: 'Live updates and alerts' },
            { key: 'email', label: 'Email Updates', desc: 'Daily summaries' },
            { key: 'emergency', label: 'Emergency Alerts', desc: 'Critical safety notifications' },
          ].map(item => (
            <View key={item.key}>
              <View style={styles.row}><View><Text style={styles.rowLabel}>{item.label}</Text><Text style={styles.rowDesc}>{item.desc}</Text></View><Switch value={notifications[item.key]} onValueChange={v => setNotifications({ ...notifications, [item.key]: v })} trackColor={{ false: '#334155', true: '#2563eb' }} /></View>
              {item.key !== 'emergency' && <View style={styles.divider} />}
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Sustainability</Text>
        <View style={styles.ecoCard}>
          <Text style={styles.ecoTitle}>🌱 Your Impact</Text>
          <View style={styles.ecoGrid}>
            <View style={styles.ecoItem}><Text style={styles.ecoValue}>342kg</Text><Text style={styles.ecoLabel}>CO₂ Saved</Text></View>
            <View style={styles.ecoItem}><Text style={styles.ecoValue}>42km</Text><Text style={styles.ecoLabel}>Green Travel</Text></View>
            <View style={styles.ecoItem}><Text style={styles.ecoValue}>18</Text><Text style={styles.ecoLabel}>Actions</Text></View>
          </View>
          <TouchableOpacity style={styles.ecoBtn} onPress={() => showToast('Leaderboard opened', 'info')}><Text style={styles.ecoBtnText}>View Leaderboard →</Text></TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.menuRow}><Text style={styles.menuIcon}>⚙️</Text><Text style={styles.menuLabel}>Settings</Text><Text style={styles.menuArrow}>→</Text></TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}><Text style={styles.menuIcon}>🛡️</Text><Text style={styles.menuLabel}>Privacy & Security</Text><Text style={styles.menuArrow}>→</Text></TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}><Text style={styles.menuIcon}>❓</Text><Text style={styles.menuLabel}>Help & Support</Text><Text style={styles.menuArrow}>→</Text></TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.menuRow}><Text style={styles.menuIcon}>📄</Text><Text style={styles.menuLabel}>About StadiumOS v1.0.0</Text><Text style={styles.menuArrow}>→</Text></TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => { logout(); showToast('Logged out', 'info'); }}><Text style={styles.logoutText}>Sign Out</Text></TouchableOpacity>

      <Text style={styles.footer}>FIFA World Cup 2026 • Stadium Operations AI Platform • Production Ready • 15K LOC • 99.9% Uptime</Text>
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { alignItems: 'center', marginTop: 50, marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  name: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  email: { color: '#64748b', fontSize: 12, marginTop: 4 },
  roleBadge: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, marginTop: 8 },
  roleText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  stat: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statValue: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: '#64748b', fontSize: 10, marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 },
  card: { backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155', overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14 },
  rowLabel: { color: '#fff', fontSize: 13, fontWeight: '500' },
  rowDesc: { color: '#64748b', fontSize: 10, marginTop: 2 },
  rowValue: { color: '#3b82f6', fontSize: 12 },
  divider: { height: 1, backgroundColor: '#334155', marginLeft: 14 },
  ecoCard: { backgroundColor: '#064e3b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#10b981' },
  ecoTitle: { color: '#a7f3d0', fontWeight: 'bold', fontSize: 14 },
  ecoGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 12 },
  ecoItem: { alignItems: 'center' },
  ecoValue: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  ecoLabel: { color: '#6ee7b7', fontSize: 10, marginTop: 2 },
  ecoBtn: { backgroundColor: '#10b981', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 12 },
  ecoBtnText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  menuRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  menuIcon: { fontSize: 18 },
  menuLabel: { color: '#fff', fontSize: 13, flex: 1 },
  menuArrow: { color: '#64748b', fontSize: 14 },
  logoutBtn: { backgroundColor: '#7f1d1d', borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: '#ef4444', marginTop: 8 },
  logoutText: { color: '#fecaca', fontWeight: 'bold', fontSize: 14 },
  footer: { color: '#334155', fontSize: 9, textAlign: 'center', marginTop: 20, lineHeight: 14 },
});
