import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput } from 'react-native';

export default function AccessibilityScreen() {
  const [prefs, setPrefs] = useState({
    wheelchair: false,
    visual: false,
    hearing: false,
    serviceAnimal: false,
    mobilityAssistance: true,
    signLanguage: false,
  });

  const facilities = [
    { name: 'Accessible Restrooms', location: 'Ground Level, Concourse, L3', available: true, icon: '🚻' },
    { name: 'Elevators', location: 'All levels, 8 units', available: true, icon: '🛗' },
    { name: 'Ramps', location: 'All gates', available: true, icon: '♿' },
    { name: 'Wheelchair Seating', location: 'East Lower, West Lower', available: true, icon: '🦽' },
    { name: 'Assistive Listening', location: 'Guest Services', available: true, icon: '🦻' },
    { name: 'Service Animal Relief', location: 'North Parking', available: true, icon: '🐕‍🦺' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>♿ Accessibility</Text><Text style={styles.subtitle}>WCAG 2.1 AA • Inclusive design for all fans</Text></View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Accessibility Profile</Text>
        <Text style={styles.sectionDesc}>Customize your experience for best support</Text>
        {[
          { key: 'wheelchair', label: 'Wheelchair User', desc: 'Step-free routes and accessible seating' },
          { key: 'visual', label: 'Visual Impairment', desc: 'Screen reader and audio assistance' },
          { key: 'hearing', label: 'Hearing Impairment', desc: 'Visual alerts and assistive listening' },
          { key: 'serviceAnimal', label: 'Service Animal', desc: 'Relief areas and access' },
          { key: 'mobilityAssistance', label: 'Mobility Assistance', desc: 'Staff escort and seating help' },
          { key: 'signLanguage', label: 'Sign Language Support', desc: 'Interpreter on request' },
        ].map(item => (
          <View key={item.key} style={styles.prefRow}>
            <View style={{ flex: 1 }}><Text style={styles.prefLabel}>{item.label}</Text><Text style={styles.prefDesc}>{item.desc}</Text></View>
            <Switch value={prefs[item.key]} onValueChange={(v) => setPrefs({ ...prefs, [item.key]: v })} trackColor={{ false: '#334155', true: '#2563eb' }} thumbColor="#fff" />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Facility Information</Text>
        {facilities.map((f, i) => (
          <View key={i} style={styles.facilityCard}>
            <Text style={styles.facilityIcon}>{f.icon}</Text>
            <View style={{ flex: 1 }}><Text style={styles.facilityName}>{f.name}</Text><Text style={styles.facilityLoc}>{f.location}</Text></View>
            <View style={[styles.availableBadge, { backgroundColor: f.available ? '#10b981' : '#ef4444' }]}><Text style={styles.availableText}>{f.available ? 'OPEN' : 'CLOSED'}</Text></View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seating Recommendations</Text>
        <View style={styles.recommendCard}><Text style={styles.recommendTitle}>✅ Recommended for you: East Lower Section 101</Text><Text style={styles.recommendDesc}>Wheelchair accessible, companion seating, elevator 20m, accessible restroom 15m, cover from sun, close to Gate A.</Text><TouchableOpacity style={styles.selectBtn}><Text style={styles.selectText}>Select This Seating</Text></TouchableOpacity></View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Request Support</Text>
        <TextInput style={styles.input} placeholder="Describe assistance needed..." placeholderTextColor="#64748b" multiline numberOfLines={3} />
        <TouchableOpacity style={styles.supportBtn}><Text style={styles.supportText}>🚨 Request Immediate Assistance</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.supportBtn, { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155' }]}><Text style={[styles.supportText, { color: '#cbd5e1' }]}>💬 Chat with Accessibility Team</Text></TouchableOpacity>
      </View>

      <View style={styles.complianceCard}><Text style={styles.complianceTitle}>✓ WCAG 2.1 AA Compliant</Text><Text style={styles.complianceDesc}>Screen readers (VoiceOver/TalkBack), 4.5:1 contrast, keyboard nav, text scaling up to 200%, voice control, haptic feedback, high-contrast mode.</Text></View>

      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 16 },
  header: { marginTop: 50, marginBottom: 20 },
  title: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 4 },
  section: { marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  sectionDesc: { color: '#64748b', fontSize: 11, marginBottom: 12 },
  prefRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#334155' },
  prefLabel: { color: '#fff', fontSize: 13, fontWeight: '600' },
  prefDesc: { color: '#64748b', fontSize: 10, marginTop: 2 },
  facilityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#334155', gap: 12 },
  facilityIcon: { fontSize: 20 },
  facilityName: { color: '#fff', fontSize: 12, fontWeight: '600' },
  facilityLoc: { color: '#64748b', fontSize: 10, marginTop: 2 },
  availableBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  availableText: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  recommendCard: { backgroundColor: '#064e3b', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#10b981' },
  recommendTitle: { color: '#a7f3d0', fontWeight: 'bold', fontSize: 13 },
  recommendDesc: { color: '#6ee7b7', fontSize: 11, marginTop: 6, lineHeight: 16 },
  selectBtn: { backgroundColor: '#10b981', borderRadius: 8, padding: 10, alignItems: 'center', marginTop: 12 },
  selectText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  input: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderRadius: 12, padding: 12, color: '#fff', fontSize: 12, minHeight: 80, textAlignVertical: 'top' },
  supportBtn: { backgroundColor: '#dc2626', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12 },
  supportText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  complianceCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155', borderLeftWidth: 4, borderLeftColor: '#10b981' },
  complianceTitle: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  complianceDesc: { color: '#94a3b8', fontSize: 10, marginTop: 6, lineHeight: 14 },
});
