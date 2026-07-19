const express = require('express');
const router = express.Router();
const chatbotService = require('../../services/chatbotService');
const { authenticateToken, optionalAuth } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/helpers');
const db = require('../../utils/db');

// Public chat route with optional auth
router.post('/chat', optionalAuth, asyncHandler(async (req, res) => {
  const { message, sessionId, stadiumId, eventId, language = 'en' } = req.body;
  if (!message) return res.status(400).json({ success: false, message: 'Message required' });
  
  const response = await chatbotService.generateResponse(message, {
    sessionId: sessionId || `sess_${Date.now()}_${Math.random().toString(36).substr(2,9)}`,
    userId: req.user?.id || null,
    stadiumId,
    eventId,
    language,
  });
  
  res.json(successResponse(response));
}));

// Authenticated routes
router.use(authenticateToken);

router.get('/history/:sessionId', asyncHandler(async (req, res) => {
  const history = await chatbotService.getChatHistory(req.params.sessionId, parseInt(req.query.limit)||50);
  res.json(successResponse(history));
}));

router.get('/sessions', asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT session_id, COUNT(*) as message_count, MAX(created_at) as last_message, MIN(created_at) as first_message
     FROM chat_messages WHERE user_id = $1 GROUP BY session_id ORDER BY last_message DESC LIMIT 20`,
    [req.user.id]
  );
  res.json(successResponse(result.rows));
}));

router.post('/feedback', asyncHandler(async (req, res) => {
  const { messageId, rating, comment } = req.body;
  if (!messageId || !rating) return res.status(400).json({ success: false, message: 'messageId and rating required' });
  const result = await db.query(
    `UPDATE chat_messages SET feedback_rating = $1, context = jsonb_set(COALESCE(context,'{}'::jsonb), '{feedback_comment}', to_jsonb($2::text)) WHERE id = $3 AND user_id = $4 RETURNING *`,
    [rating, comment||'', messageId, req.user.id]
  );
  if (result.rows.length===0) {
    // Allow updating assistant messages for same session even if not matching user_id exactly? Check session belongs to user
    const check = await db.query(`SELECT session_id FROM chat_messages WHERE id = $1`, [messageId]);
    if (check.rows.length>0) {
      await db.query(`UPDATE chat_messages SET feedback_rating = $1 WHERE id = $2 RETURNING *`, [rating, messageId]);
    }
  }
  res.json(successResponse({ success: true }, 'Feedback saved'));
}));

router.get('/stats/:stadiumId', asyncHandler(async (req, res) => {
  const stats = await chatbotService.getFeedbackStats(req.params.stadiumId);
  const countRes = await db.query(
    `SELECT COUNT(*) as total_messages, COUNT(DISTINCT session_id) as total_sessions FROM chat_messages WHERE stadium_id = $1`,
    [req.params.stadiumId]
  );
  res.json(successResponse({ ...stats, ...countRes.rows[0] }));
}));

router.post('/translate', asyncHandler(async (req, res) => {
  const { message, targetLanguage } = req.body;
  if (!message || !targetLanguage) return res.status(400).json({ success: false, message: 'message and targetLanguage required' });
  const translated = await chatbotService.translateMessage(message, targetLanguage);
  res.json(successResponse({ original: message, translated, targetLanguage }));
}));

module.exports = router;
