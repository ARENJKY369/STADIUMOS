const db = require('../utils/db');
const logger = require('../utils/logger');
const notificationService = require('./notificationService');

class IncidentService {
  async createIncident(data, reporterId) {
    const { stadiumId, zoneId, eventId, type, severity, title, description, locationDetail, latitude, longitude, priorityScore } = data;
    const result = await db.query(
      `INSERT INTO incidents (stadium_id, zone_id, event_id, reported_by, type, severity, title, description, location_detail, latitude, longitude, priority_score)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [stadiumId, zoneId, eventId, reporterId, type, severity, title, description, locationDetail, latitude, longitude, priorityScore || null]
    );
    const incident = result.rows[0];

    // Auto-assign if critical
    if (severity === 'critical' || severity === 'high') {
      await this.autoAssignIncident(incident.id, stadiumId, type);
    }

    logger.info('Incident created', { incidentId: incident.id, severity });
    return incident;
  }

  async autoAssignIncident(incidentId, stadiumId, incidentType) {
    try {
      // Find available staff with matching department
      const deptMap = { medical: 'medical', security: 'security', technical: 'operations', crowd: 'security', safety: 'security' };
      const dept = deptMap[incidentType] || 'security';
      const staffRes = await db.query(
        `SELECT id, user_id FROM staff WHERE stadium_id = $1 AND is_on_duty = true AND department ILIKE $2 ORDER BY performance_rating DESC LIMIT 1`,
        [stadiumId, `%${dept}%`]
      );
      if (staffRes.rows.length > 0) {
        await db.query('UPDATE incidents SET assigned_to = $1, status = $2 WHERE id = $3', [staffRes.rows[0].user_id, 'acknowledged', incidentId]);
        await notificationService.createNotification({
          recipientId: staffRes.rows[0].user_id,
          type: 'critical',
          title: 'Critical incident assigned',
          message: `You have been assigned to incident ${incidentId}`,
          incidentId,
          stadiumId,
          channel: 'push',
        });
      }
    } catch (e) {
      logger.error('Auto-assign failed', { error: e.message });
    }
  }

  async getIncidents(filters = {}) {
    let query = `SELECT i.*, s.name as stadium_name, z.name as zone_name, 
                        u1.first_name || ' ' || u1.last_name as reported_by_name,
                        u2.first_name || ' ' || u2.last_name as assigned_to_name
                 FROM incidents i
                 LEFT JOIN stadiums s ON s.id = i.stadium_id
                 LEFT JOIN zones z ON z.id = i.zone_id
                 LEFT JOIN users u1 ON u1.id = i.reported_by
                 LEFT JOIN users u2 ON u2.id = i.assigned_to
                 WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.stadiumId) { query += ` AND i.stadium_id = $${idx}`; params.push(filters.stadiumId); idx++; }
    if (filters.zoneId) { query += ` AND i.zone_id = $${idx}`; params.push(filters.zoneId); idx++; }
    if (filters.eventId) { query += ` AND i.event_id = $${idx}`; params.push(filters.eventId); idx++; }
    if (filters.status) { query += ` AND i.status = $${idx}`; params.push(filters.status); idx++; }
    if (filters.severity) { query += ` AND i.severity = $${idx}`; params.push(filters.severity); idx++; }
    if (filters.type) { query += ` AND i.type = $${idx}`; params.push(filters.type); idx++; }
    if (filters.assignedTo) { query += ` AND i.assigned_to = $${idx}`; params.push(filters.assignedTo); idx++; }
    if (filters.search) { query += ` AND (i.title ILIKE $${idx} OR i.description ILIKE $${idx})`; params.push(`%${filters.search}%`); idx++; }

    const countQuery = `SELECT COUNT(*) FROM (${query}) as filtered`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count,10);

    query += ` ORDER BY 
      CASE i.severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
      i.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 20, filters.offset || 0);

    const result = await db.query(query, params);
    return { incidents: result.rows, total };
  }

  async getIncidentById(id) {
    const result = await db.query(
      `SELECT i.*, s.name as stadium_name, z.name as zone_name,
              u1.email as reporter_email, u2.email as assignee_email
       FROM incidents i
       LEFT JOIN stadiums s ON s.id = i.stadium_id
       LEFT JOIN zones z ON z.id = i.zone_id
       LEFT JOIN users u1 ON u1.id = i.reported_by
       LEFT JOIN users u2 ON u2.id = i.assigned_to
       WHERE i.id = $1`, [id]
    );
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Incident not found' };
    return result.rows[0];
  }

  async updateIncident(id, updates, userId) {
    const allowed = ['status','severity','assigned_to','resolution_notes','evidence_urls','witness_reports','priority_score','zone_id'];
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(updates)) {
      if (allowed.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }
    if (fields.length === 0) return this.getIncidentById(id);

    // Handle resolved_at timestamp
    if (updates.status === 'resolved' || updates.status === 'closed') {
      fields.push(`resolved_at = NOW()`);
      if (updates.status === 'closed') fields.push(`closed_at = NOW()`);
    }

    values.push(id);
    const query = `UPDATE incidents SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Incident not found' };

    // Notify
    if (updates.status) {
      await notificationService.broadcast({
        stadiumId: result.rows[0].stadium_id,
        type: updates.status === 'resolved' ? 'info' : 'warning',
        title: `Incident ${updates.status}: ${result.rows[0].title}`,
        message: `Incident status updated to ${updates.status}`,
        incidentId: id,
      });
    }

    logger.info('Incident updated', { incidentId: id, updates: Object.keys(updates) });
    return result.rows[0];
  }

  async deleteIncident(id) {
    const result = await db.query('DELETE FROM incidents WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Incident not found' };
    return { success: true };
  }

  async getIncidentStats(stadiumId, eventId) {
    const baseFilter = eventId ? 'event_id = $1' : 'stadium_id = $1';
    const param = eventId || stadiumId;
    const results = await Promise.all([
      db.query(`SELECT severity, COUNT(*) as count FROM incidents WHERE ${baseFilter} GROUP BY severity`, [param]),
      db.query(`SELECT type, COUNT(*) as count FROM incidents WHERE ${baseFilter} GROUP BY type`, [param]),
      db.query(`SELECT status, COUNT(*) as count FROM incidents WHERE ${baseFilter} GROUP BY status`, [param]),
      db.query(`SELECT AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))/60) as avg_resolution_minutes FROM incidents WHERE ${baseFilter} AND resolved_at IS NOT NULL`, [param]),
      db.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status IN ('reported','acknowledged','in_progress') THEN 1 END) as active FROM incidents WHERE ${baseFilter}`, [param]),
    ]);
    return {
      bySeverity: results[0].rows,
      byType: results[1].rows,
      byStatus: results[2].rows,
      avgResolution: results[3].rows[0],
      counts: results[4].rows[0],
    };
  }

  async getResponseTimeMetrics(stadiumId) {
    const result = await db.query(
      `SELECT 
        AVG(EXTRACT(EPOCH FROM (updated_at - created_at))) as avg_ack_time_seconds,
        AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_seconds,
        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY EXTRACT(EPOCH FROM (resolved_at - created_at))) as p95_resolution
       FROM incidents WHERE stadium_id = $1 AND resolved_at IS NOT NULL`,
      [stadiumId]
    );
    return result.rows[0];
  }
}

module.exports = new IncidentService();
