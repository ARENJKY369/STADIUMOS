import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export default function Toast({ message, type = 'info', onHide }) {
  const opacity = new Animated.Value(0);

  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => onHide?.());
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  const bgColor = {
    info: '#2563eb', success: '#10b981', warning: '#f59e0b', error: '#ef4444', emergency: '#dc2626',
  }[type] || '#2563eb';

  return (
    <Animated.View style={[styles.container, { backgroundColor: bgColor, opacity }]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 100, left: 20, right: 20, borderRadius: 12, padding: 14, zIndex: 1000, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5 },
  text: { color: '#fff', fontSize: 13, fontWeight: '600', textAlign: 'center' },
});
