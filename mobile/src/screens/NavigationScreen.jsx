import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useCrowdContext } from '../context/CrowdContext';
import { useAppContext } from '../context/AppContext';

export default function NavigationScreen() {
  const { zones, getCrowdStatus } = useCrowdContext();
  const { stadium } = useAppContext();
  const [selectedZone, setSelectedZone] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [routeType, setRouteType] = useState('fastest'); // fastest, accessible, least_crowded
  const [showAccessibility, setShowAccessibility] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      }
    })();
  }, []);

  const getDirections = (zone) => {
    setSelectedZone(zone);
    const status = getCrowdStatus(zone.id);
    let message = `Navigate to ${zone.name}\n`;
    message += `Type: ${zone.type}\n`;
    message += `Occupancy: ${zone.current_occupancy}/${zone.capacity}\n`;
    message += `Crowd: ${status}\n\n`;
    if (status === 'critical') message += '⚠️ Critical crowding! Recommended: Use Gate A alternative (3 min longer, 40% less crowded)';
    else if (status === 'high') message += '⚡ Moderate queue ~8 min. Alternative route via Concourse reduces wait.';
    else message += '✅ Clear path, estimated 4 min walk.';
    
    Alert.alert('Navigation', message, [{ text: 'Start Navigation', onPress: () => console.log('Start nav') }, { text: 'OK' }]);
  };

  const mapRegion = {
    latitude: 40.8135,
    longitude: -74.0744,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <View style={styles.container}>
      <View style={styles.mapContainer}>
        <MapView style={styles.map} initialRegion={userLocation ? { ...userLocation, latitudeDelta: 0.01, longitudeDelta: 0.01 } : mapRegion}>
          {userLocation && <Marker coordinate={userLocation} title="You are here" pinColor="blue" />}
          {zones.map(zone => (
            <Marker key={zone.id} coordinate={{ latitude: 40.8135 + (Math.random()-0.5)*0.005, longitude: -74.0744 + (Math.random()-0.5)*0.005 }} title={zone.name} description={`${zone.type} • ${zone.current_occupancy}/${zone.capacity}`} onPress={() => setSelectedZone(zone)} pinColor={getCrowdStatus(zone.id) === 'critical' ? 'red' : getCrowdStatus(zone.id) === 'high' ? 'orange' : 'green'} />
          ))}
          {selectedZone && userLocation && (
            <Polyline coordinates={[userLocation, { latitude: 40.8135, longitude: -74.0744 }]} strokeColor="#2563eb" strokeWidth={3} lineDashPattern={[5,5]} />
          )}
        </MapView>

        <View style={styles.routeSwitcher}>
          <TouchableOpacity style={[styles.routeBtn, routeType==='fastest' && styles.routeActive]} onPress={() => setRouteType('fastest')}><Text style={styles.routeText}>⚡ Fastest</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.routeBtn, routeType==='least_crowded' && styles.routeActive]} onPress={() => setRouteType('least_crowded')}><Text style={styles.routeText}>👥 Less Crowded</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.routeBtn, routeType==='accessible' && styles.routeActive]} onPress={() => { setRouteType('accessible'); setShowAccessibility(true); }}><Text style={styles.routeText}>♿ Accessible</Text></TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.bottomSheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Stadium Zones • {stadium.name}</Text>
        <Text style={styles.subtitle}>Tap zone for directions. Crowd-aware routing enabled.</Text>

        {showAccessibility && (
          <View style={styles.accessBanner}><Text style={styles.accessTitle}>♿ Accessibility Mode</Text><Text style={styles.accessDesc}>Showing step-free routes, elevators, accessible restrooms. Ramps at all gates.</Text><TouchableOpacity onPress={() => setShowAccessibility(false)}><Text style={styles.accessClose}>Dismiss</Text></TouchableOpacity></View>
        )}

        {zones.map(zone => {
          const status = getCrowdStatus(zone.id);
          const percent = Math.round((zone.current_occupancy / zone.capacity)*100);
          return (
            <TouchableOpacity key={zone.id} style={[styles.zoneCard, selectedZone?.id===zone.id && { borderColor: '#2563eb', borderWidth: 2 }]} onPress={() => getDirections(zone)}>
              <View style={styles.zoneHeader}>
                <View style={[styles.statusDot, { backgroundColor: status==='critical' ? '#ef4444' : status==='high' ? '#f59e0b' : status==='medium' ? '#3b82f6' : '#10b981' }]} />
                <Text style={styles.zoneName}>{zone.name}</Text>
                <Text style={styles.zoneCode}>{zone.code}</Text>
              </View>
              <View style={styles.zoneMeta}>
                <Text style={styles.zoneType}>{zone.type.toUpperCase()} • Level {zone.level || 'Ground'}</Text>
                <Text style={styles.zoneOccupancy}>{zone.current_occupancy}/{zone.capacity} ({percent}%)</Text>
              </View>
              <View style={styles.progressBar}><View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: status==='critical' ? '#ef4444' : status==='high' ? '#f59e0b' : '#10b981' }]} /></View>
              <View style={styles.zoneFooter}>
                <Text style={styles.eta}>{status==='critical' ? '⚠️ 12 min queue' : status==='high' ? '⏱ 8 min' : '✅ 3-4 min'} • {zone.type==='entrance' ? 'Gate' : zone.type}</Text>
                <TouchableOpacity style={styles.goBtn}><Text style={styles.goText}>GO →</Text></TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  mapContainer: { height: '45%' },
  map: { flex: 1 },
  routeSwitcher: { position: 'absolute', top: 50, left: 10, right: 10, flexDirection: 'row', backgroundColor: '#1e293b', borderRadius: 12, padding: 4, gap: 4 },
  routeBtn: { flex: 1, padding: 8, borderRadius: 8, alignItems: 'center' },
  routeActive: { backgroundColor: '#2563eb' },
  routeText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  bottomSheet: { flex: 1, backgroundColor: '#0f172a', borderTopLeftRadius: 20, borderTopRightRadius: 20, marginTop: -20, padding: 16 },
  handle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  title: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 2, marginBottom: 16 },
  accessBanner: { backgroundColor: '#1e40af', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#3b82f6' },
  accessTitle: { color: '#fff', fontWeight: 'bold', fontSize: 13 },
  accessDesc: { color: '#bfdbfe', fontSize: 11, marginTop: 4 },
  accessClose: { color: '#60a5fa', fontSize: 11, marginTop: 8, fontWeight: '600' },
  zoneCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  zoneHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  zoneName: { color: '#fff', fontWeight: 'bold', fontSize: 14, flex: 1 },
  zoneCode: { color: '#64748b', fontSize: 10, backgroundColor: '#334155', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  zoneMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  zoneType: { color: '#64748b', fontSize: 10 },
  zoneOccupancy: { color: '#94a3b8', fontSize: 11 },
  progressBar: { height: 4, backgroundColor: '#334155', borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2 },
  zoneFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  eta: { color: '#94a3b8', fontSize: 11 },
  goBtn: { backgroundColor: '#2563eb', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  goText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});
