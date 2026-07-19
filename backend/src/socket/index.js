const jwt = require('jsonwebtoken');
const config = require('../config');
const logger = require('../utils/logger');
const db = require('../utils/db');

function setupSocketIO(io) {
  // Authentication middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
    if (!token) return next(); // allow anonymous but limited
    jwt.verify(token, config.jwt.secret, (err, decoded) => {
      if (err) {
        logger.warn('Socket auth failed', { error: err.message });
        return next(new Error('Authentication error'));
      }
      socket.user = { id: decoded.userId, email: decoded.email, role: decoded.role, stadiumId: decoded.stadiumId };
      next();
    });
  });

  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id, userId: socket.user?.id });

    // Join stadium room
    socket.on('join_stadium', (stadiumId) => {
      if (!stadiumId) return;
      socket.join(`stadium:${stadiumId}`);
      logger.info('Socket joined stadium room', { socketId: socket.id, stadiumId });
      socket.emit('joined_stadium', { stadiumId, message: `Joined stadium ${stadiumId} room` });
    });

    socket.on('join_zone', (zoneId) => {
      if (!zoneId) return;
      socket.join(`zone:${zoneId}`);
      socket.emit('joined_zone', { zoneId });
    });

    socket.on('leave_stadium', (stadiumId) => {
      socket.leave(`stadium:${stadiumId}`);
    });

    // User specific room
    if (socket.user?.id) {
      socket.join(`user:${socket.user.id}`);
      socket.join(`role:${socket.user.role}`);
    }

    // Real-time crowd update from staff devices
    socket.on('crowd_update', async (data) => {
      if (!socket.user) return socket.emit('error', { message: 'Unauthorized' });
      try {
        // Broadcast to stadium room
        io.to(`stadium:${data.stadiumId}`).emit('crowd_update', {
          ...data,
          updatedBy: socket.user.id,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        logger.error('Socket crowd_update error', { error: e.message });
      }
    });

    // Incident reporting via socket for speed
    socket.on('incident_report', async (data) => {
      try {
        const result = await db.query(
          `INSERT INTO incidents (stadium_id, zone_id, reported_by, type, severity, title, description) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
          [data.stadiumId, data.zoneId, socket.user?.id, data.type, data.severity, data.title, data.description]
        );
        const incident = result.rows[0];
        io.to(`stadium:${data.stadiumId}`).emit('incident_created', incident);
        io.to(`role:security`).emit('incident_created', incident);
        io.to(`role:admin`).emit('incident_created', incident);
        socket.emit('incident_report_success', incident);
      } catch (e) {
        socket.emit('error', { message: 'Failed to report incident', error: e.message });
      }
    });

    // Staff location update
    socket.on('staff_location', async (data) => {
      if (!socket.user) return;
      try {
        await db.query(`UPDATE staff SET current_zone_id = $1, last_known_location = ST_SetSRID(ST_MakePoint($2,$3),4326) WHERE user_id = $4`, [data.zoneId, data.longitude||0, data.latitude||0, socket.user.id]);
        io.to(`stadium:${data.stadiumId}`).emit('staff_location_updated', {
          userId: socket.user.id,
          zoneId: data.zoneId,
          latitude: data.latitude,
          longitude: data.longitude,
          timestamp: new Date().toISOString(),
        });
      } catch (e) {
        logger.error('Staff location update failed', { error: e.message });
      }
    });

    // Chat typing indicators
    socket.on('chat_typing', (data) => {
      socket.to(`stadium:${data.stadiumId}`).emit('user_typing', { userId: socket.user?.id, sessionId: data.sessionId });
    });

    // Emergency alert acknowledgment
    socket.on('emergency_ack', (data) => {
      io.to(`stadium:${data.stadiumId}`).emit('emergency_acknowledged', {
        userId: socket.user?.id,
        alertId: data.alertId,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('disconnect', (reason) => {
      logger.info('Socket disconnected', { socketId: socket.id, reason, userId: socket.user?.id });
    });

    socket.on('error', (err) => {
      logger.error('Socket error', { socketId: socket.id, error: err.message });
    });
  });

  // Periodic broadcast of crowd stats
  setInterval(async () => {
    try {
      // Get stadium list
      const stadiums = await db.query('SELECT id FROM stadiums WHERE is_active = true');
      for (const stadium of stadiums.rows) {
        const stats = await db.query(
          `SELECT COUNT(*) as zones, SUM(current_occupancy) as occupancy FROM zones WHERE stadium_id = $1`,
          [stadium.id]
        );
        io.to(`stadium:${stadium.id}`).emit('stadium_stats', {
          stadiumId: stadium.id,
          stats: stats.rows[0],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (e) {
      // ignore periodic errors
    }
  }, 30000); // every 30 seconds

  logger.info('Socket.IO setup complete with real-time rooms and events');
  return io;
}

module.exports = setupSocketIO;
