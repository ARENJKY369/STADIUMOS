const db = require('../utils/db');
const logger = require('../utils/logger');

class EventService {
  async createEvent(data, userId) {
    const { stadiumId, name, description, homeTeam, awayTeam, startTime, endTime, expectedAttendance, matchType, groupName, round } = data;
    const result = await db.query(
      `INSERT INTO events (stadium_id, name, description, home_team, away_team, start_time, end_time, expected_attendance, match_type, group_name, round, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [stadiumId, name, description, homeTeam, awayTeam, startTime, endTime, expectedAttendance, matchType, groupName, round, userId]
    );
    logger.info('Event created', { eventId: result.rows[0].id });
    return result.rows[0];
  }

  async getEvents(filters = {}) {
    let baseQuery = `
      SELECT e.*, s.name as stadium_name, s.city, s.capacity,
             u.first_name || ' ' || u.last_name as created_by_name
      FROM events e
      JOIN stadiums s ON s.id = e.stadium_id
      LEFT JOIN users u ON u.id = e.created_by
      WHERE 1=1
    `;
    const params = [];
    let idx = 1;

    if (filters.stadiumId) {
      baseQuery += ` AND e.stadium_id = $${idx}`;
      params.push(filters.stadiumId);
      idx++;
    }
    if (filters.status) {
      baseQuery += ` AND e.status = $${idx}`;
      params.push(filters.status);
      idx++;
    }
    if (filters.from) {
      baseQuery += ` AND e.start_time >= $${idx}`;
      params.push(filters.from);
      idx++;
    }
    if (filters.to) {
      baseQuery += ` AND e.start_time <= $${idx}`;
      params.push(filters.to);
      idx++;
    }
    if (filters.search) {
      baseQuery += ` AND (e.name ILIKE $${idx} OR e.home_team ILIKE $${idx} OR e.away_team ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }

    // Count
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) as filtered`;
    const countRes = await db.query(countQuery, params);
    const total = parseInt(countRes.rows[0].count, 10);

    baseQuery += ` ORDER BY e.start_time ASC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 20, filters.offset || 0);

    const result = await db.query(baseQuery, params);
    return { events: result.rows, total };
  }

  async getEventById(id) {
    const result = await db.query(
      `SELECT e.*, s.name as stadium_name, s.city, s.address, s.capacity,
              json_agg(DISTINCT jsonb_build_object('id', z.id, 'name', z.name, 'type', z.type)) as zones
       FROM events e
       JOIN stadiums s ON s.id = e.stadium_id
       LEFT JOIN zones z ON z.stadium_id = s.id
       WHERE e.id = $1
       GROUP BY e.id, s.name, s.city, s.address, s.capacity`,
      [id]
    );
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Event not found' };
    return result.rows[0];
  }

  async updateEvent(id, updates) {
    const allowedFields = ['name','description','home_team','away_team','start_time','end_time','status','expected_attendance','actual_attendance','weather_forecast','metadata'];
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }
    if (fields.length === 0) return this.getEventById(id);
    values.push(id);
    const query = `UPDATE events SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
    const result = await db.query(query, values);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Event not found' };
    logger.info('Event updated', { eventId: id });
    return result.rows[0];
  }

  async deleteEvent(id) {
    const result = await db.query('DELETE FROM events WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Event not found' };
    logger.info('Event deleted', { eventId: id });
    return { success: true };
  }

  async getEventStats(eventId) {
    const queries = await Promise.all([
      db.query('SELECT COUNT(*) as ticket_count, COUNT(CASE WHEN entry_time IS NOT NULL THEN 1 END) as entered FROM tickets WHERE event_id = $1', [eventId]),
      db.query('SELECT COUNT(*) as incident_count, COUNT(CASE WHEN severity = \'critical\' THEN 1 END) as critical FROM incidents WHERE event_id = $1', [eventId]),
      db.query('SELECT AVG(density) as avg_density, MAX(density) as max_density, AVG(occupancy_percentage) as avg_occupancy FROM crowd_metrics WHERE event_id = $1', [eventId]),
      db.query('SELECT SUM(carbon_footprint_kg) as total_carbon, SUM(eco_points) as total_points FROM sustainability_metrics WHERE event_id = $1', [eventId]),
    ]);

    return {
      tickets: queries[0].rows[0],
      incidents: queries[1].rows[0],
      crowd: queries[2].rows[0],
      sustainability: queries[3].rows[0],
    };
  }

  async getUpcomingEvents(limit = 5) {
    const result = await db.query(
      `SELECT e.*, s.name as stadium_name FROM events e JOIN stadiums s ON s.id = e.stadium_id WHERE e.start_time > NOW() AND e.status = 'scheduled' ORDER BY e.start_time ASC LIMIT $1`,
      [limit]
    );
    return result.rows;
  }

  async getLiveEvents() {
    const result = await db.query(
      `SELECT e.*, s.name as stadium_name FROM events e JOIN stadiums s ON s.id = e.stadium_id WHERE e.status = 'live' ORDER BY e.start_time DESC`
    );
    return result.rows;
  }
}

module.exports = new EventService();
