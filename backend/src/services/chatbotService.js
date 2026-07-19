const { default: Anthropic } = require('@anthropic-ai/sdk');
const config = require('../config');
const db = require('../utils/db');
const logger = require('../utils/logger');

class ChatbotService {
  constructor() {
    this.anthropic = config.apis.claudeKey ? new Anthropic({ apiKey: config.apis.claudeKey }) : null;
    this.supportedLanguages = config.tournament.supportedLanguages;
  }

  getSystemPrompt(language = 'en', stadiumContext = null, eventContext = null) {
    const stadiumInfo = stadiumContext ? `Stadium: ${stadiumContext.name} in ${stadiumContext.city}, capacity ${stadiumContext.capacity}` : '';
    const eventInfo = eventContext ? `Current event: ${eventContext.name} - ${eventContext.home_team} vs ${eventContext.away_team}` : '';
    return `You are an AI assistant for FIFA World Cup 2026 Stadium Operations.

Role: Help fans, staff, and visitors with stadium navigation, event info, safety, and services.
${stadiumInfo}
${eventInfo}

Guidelines:
- Be friendly, concise, helpful. Max 150 words unless detailed explanation needed.
- Provide navigation help using zone names (Gates, concourses, seating).
- For emergencies, advise to contact security or medical and call 911 if serious, and report location.
- Support multilingual: respond in user's language: ${language}. You know 50+ languages.
- For crowd questions, use real-time data if available.
- Never provide disallowed content. Privacy: don't share personal data.
- If asked about sustainability, mention eco-transport options and eco-points.
- Always be context-aware: use stadium and event info.

Languages auto-detect. If user switches language, follow.

Respond in ${language} language.`;
  }

  async detectIntent(message) {
    const lower = message.toLowerCase();
    const intents = [
      { intent: 'navigation', keywords: ['where', 'gate', 'section', 'find', 'directions', 'map', 'navigate', 'bathroom', 'restroom', 'food', 'concession'] },
      { intent: 'event_info', keywords: ['game', 'match', 'score', 'team', 'schedule', 'when', 'who playing', 'result'] },
      { intent: 'crowd_info', keywords: ['crowd', 'busy', 'full', 'queue', 'wait', 'crowded', 'occupancy'] },
      { intent: 'safety_emergency', keywords: ['help', 'emergency', 'medical', 'security', 'danger', 'injury', 'fight', 'suspicious'] },
      { intent: 'sustainability', keywords: ['eco', 'sustain', 'green', 'carbon', 'transport', 'bike', 'bus', 'recycle'] },
      { intent: 'ticketing', keywords: ['ticket', 'seat', 'entry', 'qr', 'access', 'validate'] },
      { intent: 'accessibility', keywords: ['wheelchair', 'accessible', 'disabled', 'elevator', 'ramp'] },
      { intent: 'general', keywords: [] },
    ];
    for (const { intent, keywords } of intents) {
      if (keywords.some(k => lower.includes(k))) return intent;
    }
    return 'general';
  }

  async getChatHistory(sessionId, limit = 10) {
    const result = await db.query(
      'SELECT role, message, intent, created_at FROM chat_messages WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2',
      [sessionId, limit]
    );
    return result.rows.reverse();
  }

  async saveMessage({ sessionId, userId, stadiumId, eventId, role, message, language, intent, confidence, context, responseTimeMs }) {
    const result = await db.query(
      `INSERT INTO chat_messages (session_id, user_id, stadium_id, event_id, role, message, language, intent, confidence, context, response_time_ms)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
      [sessionId, userId, stadiumId, eventId, role, message, language, intent, confidence || null, context ? JSON.stringify(context) : '{}', responseTimeMs || null]
    );
    return result.rows[0];
  }

  async generateResponse(userMessage, options = {}) {
    const { sessionId, userId, stadiumId, eventId, language = 'en' } = options;
    const startTime = Date.now();
    const intent = await this.detectIntent(userMessage);

    // Get context
    let stadiumContext = null;
    let eventContext = null;
    if (stadiumId) {
      const sRes = await db.query('SELECT * FROM stadiums WHERE id = $1', [stadiumId]);
      stadiumContext = sRes.rows[0] || null;
    }
    if (eventId) {
      const eRes = await db.query('SELECT * FROM events WHERE id = $1', [eventId]);
      eventContext = eRes.rows[0] || null;
    }

    const history = sessionId ? await this.getChatHistory(sessionId, 6) : [];
    const contextInfo = await this.getRelevantContext(intent, stadiumId, eventId);

    // Try Claude API, fallback to template
    let assistantMessage;
    let usedFallback = false;
    try {
      if (this.anthropic && config.features.chatbot) {
        const messages = history.map(h => ({ role: h.role, content: h.message }));
        messages.push({ role: 'user', content: `${contextInfo}\n\nUser question: ${userMessage}` });

        const response = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          system: this.getSystemPrompt(language, stadiumContext, eventContext),
          messages,
        });
        assistantMessage = response.content[0].text;
      } else {
        throw new Error('Claude API not configured');
      }
    } catch (e) {
      logger.warn('Claude API failed, using fallback', { error: e.message });
      usedFallback = true;
      assistantMessage = this.getFallbackResponse(intent, language, stadiumContext, eventContext, contextInfo);
    }

    const responseTime = Date.now() - startTime;

    // Save both messages if session
    if (sessionId) {
      await this.saveMessage({
        sessionId, userId, stadiumId, eventId, role: 'user', message: userMessage, language, intent, confidence: 0.85,
        context: { stadium: stadiumContext?.name, event: eventContext?.name }, responseTimeMs: null,
      });
      await this.saveMessage({
        sessionId, userId, stadiumId, eventId, role: 'assistant', message: assistantMessage, language, intent, confidence: usedFallback ? 0.6 : 0.92,
        context: { intent, fallback: usedFallback }, responseTimeMs: responseTime,
      });
    }

    return {
      message: assistantMessage,
      intent,
      language,
      confidence: usedFallback ? 0.6 : 0.92,
      responseTimeMs: responseTime,
      stadiumContext: stadiumContext ? { id: stadiumContext.id, name: stadiumContext.name } : null,
      eventContext: eventContext ? { id: eventContext.id, name: eventContext.name } : null,
      sessionId,
    };
  }

  async getRelevantContext(intent, stadiumId, eventId) {
    let context = '';
    try {
      if (intent === 'crowd_info' && stadiumId) {
        const crowd = await db.query(
          `SELECT z.name, cm.density, cm.occupancy_count FROM crowd_metrics cm JOIN zones z ON z.id = cm.zone_id WHERE cm.stadium_id = $1 ORDER BY cm.timestamp DESC LIMIT 5`,
          [stadiumId]
        );
        if (crowd.rows.length > 0) {
          context += `Current Crowd Data:\n${crowd.rows.map(r => `${r.name}: ${r.density}% density, ${r.occupancy_count} people`).join('\n')}\n`;
        }
      }
      if (intent === 'navigation' && stadiumId) {
        const zones = await db.query('SELECT name, code, type, level FROM zones WHERE stadium_id = $1 LIMIT 10', [stadiumId]);
        context += `Stadium Zones: ${zones.rows.map(z => `${z.name} (${z.code}, ${z.type}, Level ${z.level})`).join(', ')}\n`;
      }
    } catch (e) {
      logger.warn('Context fetch failed', { error: e.message });
    }
    return context;
  }

  getFallbackResponse(intent, language, stadium, event, contextInfo) {
    const responses = {
      navigation: `For navigation help at ${stadium?.name || 'the stadium'}: Check the main concourse for signage. Gates A and B are primary entrances. ${contextInfo} Use our mobile app map for turn-by-turn directions!`,
      event_info: event ? `Current Event: ${event.name} - ${event.home_team} vs ${event.away_team} at ${new Date(event.start_time).toLocaleString()}. Expected attendance: ${event.expected_attendance}.` : 'Check the Events page for schedule. Today features group stage matches.',
      crowd_info: `Crowd levels are being monitored real-time. ${contextInfo || 'Main concourse may have higher density during halftime. Consider using alternative routes via upper levels.'} Stay hydrated!`,
      safety_emergency: 'If this is an emergency, please immediately contact nearest security staff or call 911. Medical centers are at Ground level. Your safety is priority - share your location with staff.',
      sustainability: 'Thank you for caring about sustainability! 🌱 Use public transport, bike, or walking to earn eco-points. Recycle waste and use refill stations. Your carbon footprint matters for a greener World Cup!',
      ticketing: 'Show your QR ticket at gate readers. Ensure your ticket matches your zone. For issues, visit Guest Services at main concourse.',
      accessibility: 'Accessible entrances with ramps at all gates. Elevators available to all levels. Accessible seating and restrooms marked on map. Need assistance? Ask any staff in yellow vest.',
      general: `Welcome to ${stadium?.name || 'FIFA World Cup 2026'}! 🏆 I can help with navigation, match info, crowd updates, safety, sustainability, and tickets. What would you like to know?`,
    };
    return responses[intent] || responses.general;
  }

  async translateMessage(message, targetLanguage) {
    // Simplified translation stub - in production use Google Translate API
    if (targetLanguage === 'en') return message;
    // If Claude available, use it for translation
    if (this.anthropic) {
      try {
        const resp = await this.anthropic.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 300,
          system: `Translate the following text to ${targetLanguage}. Only return translation.`,
          messages: [{ role: 'user', content: message }],
        });
        return resp.content[0].text;
      } catch (e) {
        logger.warn('Translation failed', { error: e.message });
      }
    }
    return `[${targetLanguage}] ${message}`;
  }

  async getFeedbackStats(stadiumId) {
    const result = await db.query(
      `SELECT AVG(feedback_rating) as avg_rating, COUNT(*) as total, COUNT(CASE WHEN feedback_rating >= 4 THEN 1 END) as positive FROM chat_messages WHERE stadium_id = $1 AND role = 'assistant' AND feedback_rating IS NOT NULL`,
      [stadiumId]
    );
    return result.rows[0];
  }
}

module.exports = new ChatbotService();
