const db = require('../utils/db');
const logger = require('../utils/logger');

class NotificationService {
  async createNotification(data) {
    const { recipientId, senderId, stadiumId, incidentId, eventId, type = 'info', title, message, channel = 'in_app', priority = 1, actionUrl, metadata, isBroadcast = false, broadcastZones } = data;
    const result = await db.query(
      `INSERT INTO notifications (recipient_id, sender_id, stadium_id, incident_id, event_id, type, title, message, channel, priority, action_url, metadata, is_broadcast, broadcast_zones)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [recipientId, senderId, stadiumId, incidentId, eventId, type, title, message, channel, priority, actionUrl, metadata ? JSON.stringify(metadata) : '{}', isBroadcast, broadcastZones || null]
    );
    logger.info('Notification created', { notificationId: result.rows[0].id, type });
    return result.rows[0];
  }

  async broadcast(data) {
    const { stadiumId, type, title, message, incidentId, eventId, priority = 3, broadcastZones } = data;
    // Get all active users for stadium
    const users = await db.query(
      `SELECT u.id FROM users u JOIN staff st ON st.user_id = u.id WHERE st.stadium_id = $1 AND st.is_on_duty = true AND u.is_active = true`,
      [stadiumId]
    );

    const notifications = [];
    for (const user of users.rows) {
      const notif = await this.createNotification({
        recipientId: user.id,
        stadiumId,
        incidentId,
        eventId,
        type,
        title,
        message,
        isBroadcast: true,
        broadcastZones,
        priority,
      });
      notifications.push(notif);
    }

    // Also create one global broadcast entry without recipient for dashboard
    if (notifications.length === 0) {
      const global = await this.createNotification({
        stadiumId,
        type,
        title,
        message,
        incidentId,
        eventId,
        isBroadcast: true,
        broadcastZones,
        priority,
      });
      notifications.push(global);
    }

    return notifications;
  }

  async getNotifications(filters = {}) {
    let query = `SELECT n.*, u.email as recipient_email FROM notifications n LEFT JOIN users u ON u.id = n.recipient_id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.recipientId) { query += ` AND n.recipient_id = $${idx}`; params.push(filters.recipientId); idx++; }
    if (filters.stadiumId) { query += ` AND n.stadium_id = $${idx}`; params.push(filters.stadiumId); idx++; }
    if (filters.type) { query += ` AND n.type = $${idx}`; params.push(filters.type); idx++; }
    if (filters.isRead !== undefined) { query += ` AND n.is_read = $${idx}`; params.push(filters.isRead); idx++; }
    if (filters.isBroadcast !== undefined) { query += ` AND n.is_broadcast = $${idx}`; params.push(filters.isBroadcast); idx++; }

    query += ` ORDER BY n.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 50, filters.offset || 0);
    const result = await db.query(query, params);
    const countRes = await db.query('SELECT COUNT(*) FROM notifications WHERE recipient_id = $1 AND is_read = false', [filters.recipientId || '00000000-0000-0000-0000-000000000000']);
    return { notifications: result.rows, unreadCount: parseInt(countRes.rows[0]?.count || 0, 10) };
  }

  async markAsRead(notificationId, userId) {
    const result = await db.query(
      `UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = $1 AND (recipient_id = $2 OR recipient_id IS NULL) RETURNING *`,
      [notificationId, userId]
    );
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Notification not found' };
    return result.rows[0];
  }

  async markAllAsRead(userId) {
    const result = await db.query(
      `UPDATE notifications SET is_read = true, read_at = NOW() WHERE recipient_id = $1 AND is_read = false RETURNING id`,
      [userId]
    );
    return { updated: result.rowCount };
  }

  async deleteNotification(id, userId) {
    const result = await db.query('DELETE FROM notifications WHERE id = $1 AND recipient_id = $2 RETURNING id', [id, userId]);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Notification not found' };
    return { success: true };
  }

  async sendEmergencyAlert(data, io) {
    const { stadiumId, title, message, zones, priority = 5 } = data;
    const notification = await this.createNotification({
      stadiumId,
      type: 'emergency',
      title,
      message,
      priority,
      isBroadcast: true,
      broadcastZones: zones,
      channel: 'push',
    });

    // Socket.IO broadcast
    if (io) {
      io.to(`stadium:${stadiumId}`).emit('emergency_alert', {
        id: notification.id,
        title,
        message,
        zones,
        timestamp: new Date().toISOString(),
        priority,
      });
      io.to(`stadium:${stadiumId}`).emit('notification', notification);
    }

    logger.warn('Emergency alert sent', { stadiumId, title });
    return notification;
  }

  async getNotificationStats(stadiumId) {
    const result = await db.query(
      `SELECT type, COUNT(*) as count, COUNT(CASE WHEN is_read = false THEN 1 END) as unread FROM notifications WHERE stadium_id = $1 GROUP BY type`,
      [stadiumId]
    );
    return result.rows;
  }
}

module.exports = new NotificationService();
