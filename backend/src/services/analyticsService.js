const db = require('../utils/db');
const logger = require('../utils/logger');

class AnalyticsService {
  async getDashboardStats(stadiumId, eventId = null) {
    const eventFilter = eventId ? 'AND event_id = $2' : '';
    const params = eventId ? [stadiumId, eventId] : [stadiumId];

    const results = await Promise.all([
      db.query(`SELECT COUNT(*) as total_zones, SUM(capacity) as total_capacity, SUM(current_occupancy) as total_occupancy FROM zones WHERE stadium_id = $1`, [stadiumId]),
      db.query(`SELECT COUNT(*) as total, COUNT(CASE WHEN status IN ('reported','acknowledged','in_progress') THEN 1 END) as active FROM incidents WHERE stadium_id = $1 ${eventId ? 'AND event_id = $2' : ''}`, params),
      db.query(`SELECT AVG(density) as avg_density, MAX(density) as max_density FROM crowd_metrics WHERE stadium_id = $1 AND timestamp > NOW() - INTERVAL '1 hour' ${eventId ? 'AND event_id = $2' : ''}`, params),
      db.query(`SELECT COUNT(*) as staff_on_duty FROM staff WHERE stadium_id = $1 AND is_on_duty = true`, [stadiumId]),
      db.query(`SELECT COUNT(*) as tickets_sold, COUNT(CASE WHEN entry_time IS NOT NULL THEN 1 END) as entered FROM tickets WHERE stadium_id = $1 ${eventId ? 'AND event_id = $2' : ''}`, params),
    ]);

    const stadiumStats = results[0].rows[0];
    const occupancyPercent = stadiumStats.total_capacity ? (parseInt(stadiumStats.total_occupancy) / parseInt(stadiumStats.total_capacity) * 100).toFixed(2) : 0;

    return {
      capacity: {
        totalCapacity: parseInt(stadiumStats.total_capacity || 0,10),
        currentOccupancy: parseInt(stadiumStats.total_occupancy || 0,10),
        totalZones: parseInt(stadiumStats.total_zones || 0,10),
        occupancyPercent: parseFloat(occupancyPercent),
      },
      incidents: results[1].rows[0],
      crowd: results[2].rows[0],
      staff: results[3].rows[0],
      tickets: results[4].rows[0],
    };
  }

  async getHistoricalTrends(stadiumId, period = '7d') {
    const intervalMap = {
      '24h': "1 hour",
      '7d': "1 day",
      '30d': "1 day",
      '90d': "1 week",
    };
    const truncMap = {
      '24h': "hour",
      '7d': "day",
      '30d': "day",
      '90d': "week",
    };
    const interval = intervalMap[period] || "1 day";
    const trunc = truncMap[period] || "day";
    const days = period === '24h' ? 1 : period === '7d' ? 7 : period === '30d' ? 30 : 90;

    const result = await db.query(
      `SELECT date_trunc($3, timestamp) as period,
              AVG(density) as avg_density,
              MAX(density) as max_density,
              AVG(occupancy_count) as avg_occupancy,
              COUNT(*) as sample_count
       FROM crowd_metrics
       WHERE stadium_id = $1 AND timestamp > NOW() - INTERVAL '${days} days'
       GROUP BY period
       ORDER BY period ASC`,
      [stadiumId, interval, trunc]
    );
    return result.rows;
  }

  async getIncidentTimeline(stadiumId, hours = 24) {
    const result = await db.query(
      `SELECT date_trunc('hour', created_at) as hour, COUNT(*) as count, 
              COUNT(CASE WHEN severity='critical' THEN 1 END) as critical
       FROM incidents WHERE stadium_id = $1 AND created_at > NOW() - INTERVAL '${hours} hours'
       GROUP BY hour ORDER BY hour ASC`,
      [stadiumId]
    );
    return result.rows;
  }

  async getZoneAnalytics(stadiumId) {
    const result = await db.query(
      `SELECT z.id, z.name, z.type, z.capacity, z.current_occupancy,
              AVG(cm.density) as avg_density,
              COUNT(cm.id) as metric_count,
              COUNT(DISTINCT i.id) as incident_count
       FROM zones z
       LEFT JOIN crowd_metrics cm ON cm.zone_id = z.id AND cm.timestamp > NOW() - INTERVAL '24 hours'
       LEFT JOIN incidents i ON i.zone_id = z.id AND i.created_at > NOW() - INTERVAL '24 hours'
       WHERE z.stadium_id = $1
       GROUP BY z.id ORDER BY z.code`,
      [stadiumId]
    );
    return result.rows;
  }

  async getSustainabilityAnalytics(stadiumId, eventId) {
    const filter = eventId ? 'event_id = $2' : 'stadium_id = $1';
    const params = eventId ? [stadiumId, eventId] : [stadiumId];
    const result = await db.query(
      `SELECT category, SUM(carbon_footprint_kg) as total_carbon, SUM(eco_points) as total_points,
              COUNT(*) as entries, AVG(value) as avg_value
       FROM sustainability_metrics WHERE ${filter} GROUP BY category`,
      params
    );
    const totals = await db.query(
      `SELECT SUM(carbon_footprint_kg) as total_carbon, SUM(eco_points) as total_points, COUNT(DISTINCT user_id) as users
       FROM sustainability_metrics WHERE ${filter}`, params
    );
    return { byCategory: result.rows, totals: totals.rows[0] };
  }

  async getStaffPerformance(stadiumId) {
    const result = await db.query(
      `SELECT st.id, u.first_name, u.last_name, st.department, st.performance_rating,
              COUNT(sa.id) as assignments_completed,
              AVG(EXTRACT(EPOCH FROM (sa.checkout_time - sa.checkin_time))/3600) as avg_hours
       FROM staff st
       JOIN users u ON u.id = st.user_id
       LEFT JOIN staff_assignments sa ON sa.staff_id = st.id AND sa.status = 'completed'
       WHERE st.stadium_id = $1
       GROUP BY st.id, u.first_name, u.last_name ORDER BY st.performance_rating DESC`,
      [stadiumId]
    );
    return result.rows;
  }

  async createSnapshot(stadiumId, eventId, type = 'hourly') {
    const stats = await this.getDashboardStats(stadiumId, eventId);
    const incidentRes = await db.query('SELECT COUNT(*) FROM incidents WHERE stadium_id = $1', [stadiumId]);
    const result = await db.query(
      `INSERT INTO analytics_snapshots (stadium_id, event_id, snapshot_type, period_start, period_end, total_attendance, avg_occupancy_percent, peak_occupancy_percent, incident_count, kpis)
       VALUES ($1,$2,$3,NOW() - INTERVAL '1 hour', NOW(), $4, $5, $6, $7, $8) RETURNING *`,
      [stadiumId, eventId, type, stats.capacity.currentOccupancy, stats.capacity.occupancyPercent, stats.capacity.occupancyPercent, parseInt(incidentRes.rows[0].count,10), JSON.stringify(stats)]
    );
    return result.rows[0];
  }

  async exportData(stadiumId, format = 'json', filters = {}) {
    // For CSV export would stream, but JSON for now
    const tables = ['crowd_metrics','incidents','sustainability_metrics'];
    const data = {};
    for (const table of tables) {
      const res = await db.query(`SELECT * FROM ${table} WHERE stadium_id = $1 ORDER BY created_at DESC LIMIT 1000`, [stadiumId]);
      data[table] = res.rows;
    }
    return data;
  }
}

module.exports = new AnalyticsService();
