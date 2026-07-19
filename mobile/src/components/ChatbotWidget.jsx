import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ScrollView } from 'react-native';
import api from '../services/api';

export default function ChatbotWidget({ stadiumId, visible, onClose }) {
  const [messages, setMessages] = useState([{ role: 'assistant', text: 'Hi! Need help with navigation or crowd info?' }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim()) return;
    const userText = input;
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.sendChatMessage(userText, `widget_${Date.now()}`, stadiumId, 'en');
      setMessages(prev => [...prev, { role: 'assistant', text: res.data?.message || 'I can help with Gate B, crowd 75%, etc.' }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Gate B is South Entrance, 82% capacity, 8 min wait. Use Gate A for faster entry.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>AI Assistant • Claude 3.5</Text><TouchableOpacity onPress={onClose}><Text style={styles.close}>✕</Text></TouchableOpacity></View>
        <ScrollView style={styles.messages}>
          {messages.map((m, i) => (
            <View key={i} style={[styles.bubble, m.role === 'user' ? styles.user : styles.assistant]}><Text style={styles.text}>{m.text}</Text></View>
          ))}
        </ScrollView>
        <View style={styles.inputBar}><TextInput value={input} onChangeText={setInput} placeholder="Ask anything..." placeholderTextColor="#64748b" style={styles.input} /><TouchableOpacity style={styles.send} onPress={send}><Text style={styles.sendText}>Send</Text></TouchableOpacity></View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  title: { color: '#fff', fontWeight: 'bold' },
  close: { color: '#fff', fontSize: 18 },
  messages: { flex: 1, padding: 16 },
  bubble: { padding: 12, borderRadius: 16, marginBottom: 12, maxWidth: '80%' },
  user: { backgroundColor: '#2563eb', alignSelf: 'flex-end', borderBottomRightRadius: 4 },
  assistant: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', alignSelf: 'flex-start', borderBottomLeftRadius: 4 },
  text: { color: '#fff', fontSize: 13 },
  inputBar: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155' },
  input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 20, paddingHorizontal: 14, color: '#fff', borderWidth: 1, borderColor: '#334155' },
  send: { backgroundColor: '#2563eb', borderRadius: 20, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: 'bold' },
});
