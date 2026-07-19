/**
 * Chat Service - GenAI Integration
 * Handles Claude API communication, multilingual support, offline queue
 * 50+ languages, context awareness, intent recognition
 */
import api from './api';

class ChatService {
  constructor() {
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
    this.history = [];
    this.offlineQueue = [];
    this.isOnline = navigator.onLine;
    
    window.addEventListener('online', () => { this.isOnline = true; this.processQueue(); });
    window.addEventListener('offline', () => { this.isOnline = false; });
  }

  async sendMessage(message, options = {}) {
    const { stadiumId, eventId, language = 'en', userId } = options;
    
    // Detect intent locally for quick UX
    const intent = this.detectIntentLocal(message);
    
    // Optimistic offline handling
    if (!this.isOnline) {
      this.offlineQueue.push({ message, options, timestamp: Date.now() });
      return { message: this.getOfflineReply(intent), intent, offline: true, confidence: 0.6 };
    }

    try {
      const response = await api.post('/chatbot/chat', {
        message,
        sessionId: this.sessionId,
        stadiumId,
        eventId,
        language,
        userId,
      });
      
      const data = response.data.data;
      this.history.push({ role: 'user', message, timestamp: new Date().toISOString() });
      this.history.push({ role: 'assistant', message: data.message, timestamp: new Date().toISOString(), intent: data.intent });
      
      // Keep only last 50
      if (this.history.length > 50) this.history = this.history.slice(-50);
      
      return data;
    } catch (error) {
      console.error('Chat service error', error);
      // Fallback to local intent response
      return {
        message: this.getFallbackResponse(intent, stadiumId),
        intent,
        confidence: 0.6,
        fallback: true,
        error: error.message,
      };
    }
  }

  detectIntentLocal(message) {
    const lower = message.toLowerCase();
    const patterns = {
      navigation: ['where', 'gate', 'find', 'directions', 'navigate', 'bathroom', 'food', 'seat', 'section'],
      crowd_info: ['crowd', 'busy', 'queue', 'wait', 'full', 'density', 'occupancy'],
      event_info: ['game', 'match', 'score', 'team', 'schedule', 'when', 'who'],
      safety_emergency: ['help', 'emergency', 'medical', 'security', 'danger', 'injury'],
      sustainability: ['eco', 'sustain', 'green', 'carbon', 'transport', 'bike', 'bus'],
      accessibility: ['wheelchair', 'accessible', 'disabled', 'elevator', 'ramp'],
      ticketing: ['ticket', 'qr', 'entry', 'validate', 'seat'],
    };
    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.some(k => lower.includes(k))) return intent;
    }
    return 'general';
  }

  getFallbackResponse(intent, stadiumId) {
    const stadiumName = stadiumId ? 'the stadium' : 'MetLife Stadium';
    const responses = {
      navigation: `At ${stadiumName}, Gates A (North) and B (South) are main entrances. Concourse level has food, restrooms. Seating sections: Lower East/West, Upper North. Use map in Navigation tab for turn-by-turn.`,
      crowd_info: `Current occupancy ~75% (62k fans). Peak expected 14:30 at Gate B. Least crowded: Gate A 64% (3 min). Concourse moderate 74%. AI recommends opening Gate C.`,
      event_info: `Today: USA vs Mexico 20:00 at MetLife Stadium, 80k expected. Tomorrow: England vs Germany 19:00. Check Events page for full calendar.`,
      safety_emergency: `🚨 Emergency: Find nearest staff (yellow vest) or call 911. Medical Center Ground Level near Gate A. Security Control Center central. Share your zone location.`,
      sustainability: `🌱 Eco tip: Take bus/train = save 12kg CO₂ + 50 eco-points. Bike parking North. Water refill free. Recycling bins concourse. Leaderboard #12 = 1,240 pts.`,
      accessibility: `♿ All gates ramped. Elevators to all levels. Accessible restrooms concourse & L3. Wheelchair seating East/West Lower. Service animal relief North Parking. Need escort? Ask staff.`,
      ticketing: `🎟️ Show QR at gate readers. Ensure zone matches ticket. Issues? Guest Services Main Concourse. Entry opens 3h before kickoff.`,
      general: `Welcome to FIFA World Cup 2026! I can help with: 🗺️ navigation, 👥 crowd, 🏆 events, 🚨 safety, 🌱 sustainability, ♿ accessibility, 🎟️ tickets. What do you need?`,
    };
    return responses[intent] || responses.general;
  }

  getOfflineReply(intent) {
    return `[Offline Mode] ${this.getFallbackResponse(intent)} Your message will be sent when online.`;
  }

  async translateMessage(message, targetLanguage) {
    try {
      const response = await api.post('/chatbot/translate', { message, targetLanguage });
      return response.data.data.translated;
    } catch {
      return `[${targetLanguage}] ${message}`; // fallback
    }
  }

  async getHistory(sessionId = this.sessionId, limit = 50) {
    try {
      const res = await api.get(`/chatbot/history/${sessionId}?limit=${limit}`);
      return res.data.data;
    } catch {
      return this.history;
    }
  }

  async getSessions() {
    try {
      const res = await api.get('/chatbot/sessions');
      return res.data.data;
    } catch {
      return [];
    }
  }

  async sendFeedback(messageId, rating, comment) {
    try {
      const res = await api.post('/chatbot/feedback', { messageId, rating, comment });
      return res.data.data;
    } catch (e) {
      console.error('Feedback failed', e);
      return { success: false };
    }
  }

  clearHistory() {
    this.history = [];
    this.sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2,9)}`;
  }

  async processQueue() {
    if (this.offlineQueue.length === 0) return;
    console.log(`Processing ${this.offlineQueue.length} queued messages`);
    const queue = [...this.offlineQueue];
    this.offlineQueue = [];
    for (const item of queue) {
      try {
        await this.sendMessage(item.message, item.options);
      } catch {}
    }
  }
}

export default new ChatService();
