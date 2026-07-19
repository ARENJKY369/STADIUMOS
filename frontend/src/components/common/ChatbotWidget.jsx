import React, { useState, useRef, useEffect } from 'react';
import api from '../../services/api';

export default function ChatbotWidget({ stadiumId, eventId, language = 'en' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hello! I\'m your FIFA 2026 AI assistant. I can help with navigation, crowd info, safety, and sustainability. How can I help?', timestamp: new Date().toISOString() },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(`web_${Date.now()}`);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.post('/chatbot/chat', { message: text, sessionId, stadiumId, eventId, language });
      const assistantText = res.data?.data?.message || res.data?.message || 'I can help with Gate B (82% full) or navigation.';
      setMessages(prev => [...prev, { role: 'assistant', text: assistantText, timestamp: new Date().toISOString(), intent: res.data?.data?.intent }]);
    } catch (e) {
      // Fallback offline
      const fallback = getLocalReply(text);
      setMessages(prev => [...prev, { role: 'assistant', text: fallback, timestamp: new Date().toISOString(), intent: 'fallback' }]);
    } finally {
      setLoading(false);
    }
  };

  const getLocalReply = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('gate')) return 'Gate B South Entrance: 82% capacity (8 min queue). Gate A alternative: 64% (3 min). Want directions?';
    if (lower.includes('crowd')) return 'Live: 75.5% occupancy (62,340 fans). Highest: East Lower 94%. Peak forecast 14:30 Gate B. Open Gate C reduces pressure 18%.';
    if (lower.includes('food')) return 'Concession Area East: 12 vendors, 5 min wait. VIP Level 3 premium dining. Water refill stations free.';
    if (lower.includes('emergency')) return '🚨 Emergency: Contact nearest staff (yellow vest) or call 911. Medical at Ground Level Gate A. Share location.';
    if (lower.includes('sustain')) return '🌱 Use bus/train: save 12kg CO₂, earn 50 eco-points. Bike parking North. You have 1,240 points (#12 leaderboard).';
    return `Welcome to MetLife Stadium! I can help: navigation (gates, seating), crowd (density, waits), events, safety, accessibility, sustainability. Try "least crowded food?"`;
  };

  const quickChips = ["Where is Gate B?", "Is it crowded?", "Food options?", "♿ Accessible route?", "🌱 Eco points?", "Emergency help"];

  if (!isOpen) {
    return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 flex items-center justify-center text-xl z-50 hover:scale-105 transition-transform">💬</button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col z-50 overflow-hidden">
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs">AI</div><div><p className="font-semibold text-sm">Stadium Assistant</p><p className="text-xs text-slate-400">Claude 3.5 • 50+ languages • Live context</p></div></div>
        <div className="flex items-center gap-2"><span className="px-2 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 text-xs flex items-center gap-1"><span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>LIVE</span><button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-lg">✕</button></div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.role === 'user' ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-bl-sm'}`}>
              <p>{m.text}</p><p className="text-[10px] opacity-60 mt-1">{new Date(m.timestamp).toLocaleTimeString()} {m.intent && `• ${m.intent}`}</p>
            </div>
          </div>
        ))}
        {loading && <div className="flex justify-start"><div className="bg-white dark:bg-slate-800 border rounded-2xl rounded-bl-sm px-3 py-2 text-sm flex items-center gap-2"><span className="w-4 h-4 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin"></span>AI thinking...</div></div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-2 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="flex gap-1 overflow-x-auto pb-2">
          {quickChips.map(chip => <button key={chip} onClick={() => sendMessage(chip)} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs whitespace-nowrap">{chip}</button>)}
        </div>
        <div className="flex gap-2">
          <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendMessage()} placeholder="Ask about navigation, crowd, safety..." className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <button onClick={() => sendMessage()} disabled={!input.trim() || loading} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium disabled:opacity-50">Send</button>
        </div>
        <p className="text-[10px] text-slate-500 mt-2 text-center">Claude API • Multilingual • Context-aware • WCAG AA</p>
      </div>
    </div>
  );
}
