import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAppContext } from '../context/AppContext';
import api from '../services/api';
import * as Speech from 'expo-speech';

export default function ChatScreen() {
  const { stadium, language } = useAppContext();
  const [messages, setMessages] = useState([
    { id: '1', role: 'assistant', message: `Welcome to ${stadium.name}! 🏟️ I'm your AI assistant for FIFA World Cup 2026. I can help with navigation, crowd info, events, safety, and sustainability. How can I help today?`, timestamp: new Date().toISOString(), intent: 'greeting' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`mobile_${Date.now()}`);
  const scrollRef = useRef(null);

  const quickReplies = [
    "Where is Gate B?",
    "Is it crowded now?",
    "Show me food options",
    "Emergency help",
    "Sustainability tips",
    "Accessible route to seating",
  ];

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    const userMsg = { id: Date.now().toString(), role: 'user', message: text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage(text, sessionId, stadium.id, language);
      const assistantText = res.data?.message || res.message || generateLocalReply(text);
      const assistantMsg = {
        id: (Date.now()+1).toString(),
        role: 'assistant',
        message: assistantText,
        timestamp: new Date().toISOString(),
        intent: res.data?.intent || 'general',
        confidence: res.data?.confidence || 0.85,
      };
      setMessages(prev => [...prev, assistantMsg]);
      // Optional TTS for accessibility
      // Speech.speak(assistantText, { language: language || 'en' });
    } catch (e) {
      const fallback = generateLocalReply(text);
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'assistant', message: fallback, timestamp: new Date().toISOString(), intent: 'fallback' }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const generateLocalReply = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('gate')) return `Gate B is South Entrance. Currently 82% capacity, 8 min queue. Alternative Gate A at 64% (3 min). Would you like turn-by-turn directions?`;
    if (lower.includes('crowd')) return `Current occupancy 75.5% (62,340 fans). Highest density: East Lower 94%. AI predicts peak at 14:30 at Gate B. Recommend using Gate C to reduce pressure.`;
    if (lower.includes('food') || lower.includes('concession')) return `Concession Area East has 12 vendors: burgers, vegan, tacos, drinks. Current wait ~5 min. VIP lounge on Level 3 has premium dining.`;
    if (lower.includes('emergency') || lower.includes('help')) return `🚨 If emergency: Contact nearest staff in yellow vest or call 911. Medical Center at Ground Level near Gate A. Share your zone: Main Concourse. Stay calm, help is on way.`;
    if (lower.includes('sustain')) return `🌱 Great! Use bus/train instead of car: save ~12kg CO₂, earn 50 eco-points. Bike parking at North. Recycling at Concourse. You're #12 on leaderboard with 1,240 pts!`;
    if (lower.includes('accessible') || lower.includes('wheelchair')) return `♿ Accessible routes: All gates have ramps. Elevators to all levels. Accessible restrooms at concourse. Seating: East Lower has wheelchair spots. Need assistance? Staff can escort.`;
    return `Thanks for asking! At ${stadium.name}, I can help with navigation (gates, seating, facilities), real-time crowd (density, waits), event schedule, safety, and eco-friendly options. Try: "Where is medical?" or "Least crowded food?"`;
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}><View style={styles.aiAvatar}><Text style={styles.aiAvatarText}>AI</Text></View><View><Text style={styles.headerTitle}>Stadium Assistant</Text><Text style={styles.headerSubtitle}>Claude 3.5 Sonnet • 50+ languages • Live context</Text></View></View>
        <View style={styles.liveIndicator}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE</Text></View>
      </View>

      <ScrollView ref={scrollRef} style={styles.messages} contentContainerStyle={{ paddingBottom: 20 }}>
        {messages.map(msg => (
          <View key={msg.id} style={[styles.messageRow, msg.role==='user' ? styles.userRow : styles.assistantRow]}>
            {msg.role==='assistant' && <View style={styles.assistantBubbleAvatar}><Text style={styles.avatarTiny}>AI</Text></View>}
            <View style={[styles.bubble, msg.role==='user' ? styles.userBubble : styles.assistantBubble]}>
              <Text style={[styles.messageText, msg.role==='user' ? { color: '#fff' } : { color: '#e2e8f0' }]}>{msg.message}</Text>
              <View style={styles.metaRow}><Text style={styles.time}>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>{msg.intent && <Text style={styles.intent}>{msg.intent}</Text>}</View>
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.loadingRow}><View style={styles.assistantBubbleAvatar}><Text style={styles.avatarTiny}>AI</Text></View><View style={[styles.bubble, styles.assistantBubble]}><ActivityIndicator color="#3b82f6" /><Text style={styles.typing}>AI is thinking...</Text></View></View>
        )}
      </ScrollView>

      <View style={styles.quickRepliesContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
          {quickReplies.map(q => (
            <TouchableOpacity key={q} style={styles.quickChip} onPress={() => sendMessage(q)}><Text style={styles.quickChipText}>{q}</Text></TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.inputBar}>
        <TextInput value={input} onChangeText={setInput} placeholder="Ask about navigation, crowd, safety..." placeholderTextColor="#64748b" style={styles.input} multiline onSubmitEditing={() => sendMessage()} />
        <TouchableOpacity style={[styles.sendBtn, !input.trim() && { opacity: 0.5 }]} onPress={() => sendMessage()} disabled={!input.trim() || loading}><Text style={styles.sendText}>➤</Text></TouchableOpacity>
      </View>

      <Text style={styles.footerHint}>Supports 50+ languages • Auto-translate • Voice input coming • Powered by Claude API</Text>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 50, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  aiAvatarText: { color: '#fff', fontWeight: 'bold', fontSize: 12 },
  headerTitle: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  headerSubtitle: { color: '#64748b', fontSize: 10, marginTop: 2 },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f2937', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10b981' },
  liveText: { color: '#10b981', fontSize: 10, fontWeight: 'bold' },
  messages: { flex: 1, padding: 16 },
  messageRow: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-end', gap: 8 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  assistantBubbleAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  avatarTiny: { color: '#fff', fontSize: 9, fontWeight: 'bold' },
  bubble: { maxWidth: '75%', borderRadius: 20, padding: 12, paddingHorizontal: 16 },
  userBubble: { backgroundColor: '#2563eb', borderBottomRightRadius: 4 },
  assistantBubble: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', borderBottomLeftRadius: 4 },
  messageText: { fontSize: 13, lineHeight: 18 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, gap: 12 },
  time: { color: '#64748b', fontSize: 9 },
  intent: { color: '#3b82f6', fontSize: 9, backgroundColor: '#1e3a8a', paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  typing: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  quickRepliesContainer: { paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: '#1e293b' },
  quickChip: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginRight: 8 },
  quickChipText: { color: '#cbd5e1', fontSize: 11 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 12, gap: 8, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155' },
  input: { flex: 1, backgroundColor: '#0f172a', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, color: '#fff', maxHeight: 100, borderWidth: 1, borderColor: '#334155', fontSize: 13 },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563eb', justifyContent: 'center', alignItems: 'center' },
  sendText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  footerHint: { color: '#475569', fontSize: 9, textAlign: 'center', padding: 6, backgroundColor: '#1e293b' },
});
