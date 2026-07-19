const express = require('express');
const router = express.Router();
const notificationService = require('../../services/notificationService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { validateJoi } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse, getPagination } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const { type, isRead, isBroadcast, stadiumId, page = 1, limit = 20 } = req.query;
  const pag = getPagination(page, limit, 0);
  const { notifications, unreadCount } = await notificationService.getNotifications({
    recipientId: req.user.id,
    type,
    isRead: isRead !== undefined ? isRead === 'true' : undefined,
    isBroadcast: isBroadcast !== undefined ? isBroadcast === 'true' : undefined,
    stadiumId,
    limit: pag.perPage,
    offset: pag.offset,
  });
  res.json(successResponse(notifications, 'Notifications retrieved', { ...pag, unreadCount }));
}));

router.get('/stats/:stadiumId', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const stats = await notificationService.getNotificationStats(req.params.stadiumId);
  res.json(successResponse(stats));
}));

router.post('/', authorizeRoles('admin','manager'), validateJoi('notification'), asyncHandler(async (req, res) => {
  const notification = await notificationService.createNotification({
    ...req.body,
    senderId: req.user.id,
  });
  req.app.get('io')?.to(`stadium:${notification.stadium_id}`).emit('notification', notification);
  if (notification.recipient_id) {
    req.app.get('io')?.to(`user:${notification.recipient_id}`).emit('notification', notification);
  }
  res.status(201).json(successResponse(notification, 'Notification sent'));
}));

router.post('/broadcast', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const { stadiumId, type, title, message, priority, broadcastZones } = req.body;
  if (!stadiumId || !title || !message) return res.status(400).json({ success: false, message: 'stadiumId, title, message required' });
  const notifications = await notificationService.broadcast({ stadiumId, type, title, message, priority, broadcastZones });
  req.app.get('io')?.to(`stadium:${stadiumId}`).emit('notification_broadcast', { title, message, type });
  res.json(successResponse(notifications, 'Broadcast sent'));
}));

router.post('/emergency', authorizeRoles('admin','manager','security'), asyncHandler(async (req, res) => {
  const { stadiumId, title, message, zones } = req.body;
  if (!stadiumId || !title || !message) return res.status(400).json({ success: false, message: 'Required fields missing' });
  const notification = await notificationService.sendEmergencyAlert({ stadiumId, title, message, zones }, req.app.get('io'));
  res.json(successResponse(notification, 'Emergency alert sent'));
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const notification = await notificationService.markAsRead(req.params.id, req.user.id);
  res.json(successResponse(notification, 'Marked as read'));
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  const result = await notificationService.markAllAsRead(req.user.id);
  res.json(successResponse(result, 'All marked as read'));
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const result = await notificationService.deleteNotification(req.params.id, req.user.id);
  res.json(successResponse(result, 'Notification deleted'));
}));

module.exports = router;
