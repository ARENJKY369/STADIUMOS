import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';

export default function Button({ title, onPress, variant = 'primary', size = 'md', loading = false, disabled = false, style, textStyle }) {
  const variantStyle = {
    primary: { backgroundColor: '#2563eb' },
    secondary: { backgroundColor: '#334155' },
    danger: { backgroundColor: '#dc2626' },
    ghost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#334155' },
  }[variant] || { backgroundColor: '#2563eb' };

  const sizeStyle = {
    sm: { paddingHorizontal: 12, paddingVertical: 6 },
    md: { paddingHorizontal: 16, paddingVertical: 10 },
    lg: { paddingHorizontal: 24, paddingVertical: 14 },
  }[size] || { paddingHorizontal: 16, paddingVertical: 10 };

  return (
    <TouchableOpacity
      style={[styles.button, variantStyle, sizeStyle, disabled && styles.disabled, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.text, variant === 'ghost' && { color: '#cbd5e1' }, textStyle]}>{title}</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  text: { color: '#fff', fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.5 },
});
