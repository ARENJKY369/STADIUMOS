import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, Circle } from 'react-native-maps';

export default function StadiumMap({ zones = [], userLocation, selectedZone, onSelectZone }) {
  const initialRegion = {
    latitude: 40.8135,
    longitude: -74.0744,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={styles.container}>
      <MapView style={styles.map} initialRegion={initialRegion} showsUserLocation showsMyLocationButton>
        {zones.map(zone => (
          <Marker
            key={zone.id}
            coordinate={{ latitude: 40.8135 + (Math.random()-0.5)*0.01, longitude: -74.0744 + (Math.random()-0.5)*0.01 }}
            title={zone.name}
            description={`${zone.type} - ${zone.current_occupancy}/${zone.capacity}`}
            pinColor={zone.current_occupancy / zone.capacity > 0.9 ? 'red' : zone.current_occupancy / zone.capacity > 0.8 ? 'orange' : 'green'}
            onPress={() => onSelectZone?.(zone)}
          />
        ))}
        {selectedZone && userLocation && (
          <Polyline coordinates={[userLocation, { latitude: 40.8135, longitude: -74.0744 }]} strokeColor="#2563eb" strokeWidth={3} />
        )}
        {selectedZone && (
          <Circle center={{ latitude: 40.8135, longitude: -74.0744 }} radius={200} strokeColor="#2563eb" fillColor="rgba(37,99,235,0.1)" />
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  map: { flex: 1 },
});
