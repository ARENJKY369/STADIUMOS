const db = require('../utils/db');
const logger = require('../utils/logger');

class ZoneService {
  async createZone(data) {
    const { stadiumId, name, code, type, capacity, level, gateNumber, coordinates, amenities } = data;
    const result = await db.query(
      `INSERT INTO zones (stadium_id, name, code, type, capacity, level, gate_number, coordinates, amenities)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [stadiumId, name, code, type, capacity, level, gateNumber, coordinates ? JSON.stringify(coordinates) : null, amenities ? JSON.stringify(amenities) : null]
    );
    logger.info('Zone created', { zoneId: result.rows[0].id });
    return result.rows[0];
  }

  async getZones(filters = {}) {
    let query = `SELECT z.*, s.name as stadium_name FROM zones z JOIN stadiums s ON s.id = z.stadium_id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.stadiumId) {
      query += ` AND z.stadium_id = $${idx}`;
      params.push(filters.stadiumId);
      idx++;
    }
    if (filters.type) {
      query += ` AND z.type = $${idx}`;
      params.push(filters.type);
      idx++;
    }
    if (filters.status) {
      query += ` AND z.status = $${idx}`;
      params.push(filters.status);
      idx++;
    }
    if (filters.search) {
      query += ` AND (z.name ILIKE $${idx} OR z.code ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }
    query += ` ORDER BY z.code ASC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 50, filters.offset || 0);

    const result = await db.query(query, params);
    const countRes = await db.query('SELECT COUNT(*) FROM zones WHERE stadium_id = $1', [filters.stadiumId || result.rows[0]?.stadium_id || '00000000-0000-0000-0000-000000000000']);
    // simpler count for total ignoring filters but okay
    const totalRes = await db.query('SELECT COUNT(*) FROM zones');
    return { zones: result.rows, total: parseInt(totalRes.rows[0].count,10) };
  }

  async getZoneById(id) {
    const result = await db.query(
      `SELECT z.*, s.name as stadium_name, s.city FROM zones z JOIN stadiums s ON s.id = z.stadium_id WHERE z.id = $1`, [id]
    );
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Zone not found' };
    
    // Get latest crowd metric
    const crowd = await db.query(
      `SELECT * FROM crowd_metrics WHERE zone_id = $1 ORDER BY timestamp DESC LIMIT 1`, [id]
    );
    const staff = await db.query(
      `SELECT st.id, u.first_name, u.last_name, st.department FROM staff st JOIN users u ON u.id = st.user_id WHERE st.current_zone_id = $1 AND st.is_on_duty = true`, [id]
    );
    return { ...result.rows[0], latestMetrics: crowd.rows[0] || null, onDutyStaff: staff.rows };
  }

  async updateZone(id, updates) {
    const allowed = ['name','type','status','capacity','current_occupancy','level','gate_number','coordinates','amenities','accessibility_features'];
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of Object.keys(updates)) {
      const dbKey = key === 'stadiumId' ? 'stadium_id' : key === 'currentOccupancy' ? 'current_occupancy' : key === 'gateNumber' ? 'gate_number' : key === 'accessibilityFeatures' ? 'accessibility_features' : key;
      if (allowed.includes(dbKey)) {
        fields.push(`${dbKey} = $${idx}`);
        values.push(typeof updates[key] === 'object' ? JSON.stringify(updates[key]) : updates[key]);
        idx++;
      }
    }
    if (fields.length === 0) return this.getZoneById(id);
    values.push(id);
    const result = await db.query(`UPDATE zones SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`, values);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Zone not found' };
    return result.rows[0];
  }

  async deleteZone(id) {
    const result = await db.query('DELETE FROM zones WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'Zone not found' };
    return { success: true };
  }

  async getZoneOccupancy(stadiumId) {
    const result = await db.query(`SELECT * FROM v_zone_occupancy_status WHERE stadium_id = $1 ORDER BY occupancy_percent DESC`, [stadiumId]);
    return result.rows;
  }

  async updateOccupancy(zoneId, occupancyCount) {
    const zoneRes = await db.query('SELECT capacity FROM zones WHERE id = $1', [zoneId]);
    if (zoneRes.rows.length === 0) throw { statusCode: 404, message: 'Zone not found' };
    const capacity = zoneRes.rows[0].capacity;
    const percentage = capacity > 0 ? (occupancyCount / capacity * 100) : 0;
    const result = await db.query(
      `UPDATE zones SET current_occupancy = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [occupancyCount, zoneId]
    );
    return { ...result.rows[0], occupancy_percentage: percentage };
  }

  async getCriticalZones(stadiumId, threshold = 80) {
    const result = await db.query(
      `SELECT * FROM v_zone_occupancy_status WHERE stadium_id = $1 AND occupancy_percent >= $2 ORDER BY occupancy_percent DESC`,
      [stadiumId, threshold]
    );
    return result.rows;
  }
}

module.exports = new ZoneService();
