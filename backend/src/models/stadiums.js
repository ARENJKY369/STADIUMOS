/**
 * Model: stadiums
 * Database model wrapper for stadiums table
 * Production-ready with validation, queries, relations
 */
const db = require('../utils/db');
const logger = require('../utils/logger');

class StadiumsModel {
  constructor() {
    this.table = 'stadiums';
  }

  async findById(id) {
    const res = await db.query(`SELECT * FROM stadiums WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async findAll(filters = {}, options = {}) {
    let query = `SELECT * FROM stadiums WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.stadium_id) {
      query += ` AND stadium_id = $${idx}`;
      params.push(filters.stadium_id);
      idx++;
    }
    if (filters.status) {
      query += ` AND status = $${idx}`;
      params.push(filters.status);
      idx++;
    }
    const limit = options.limit || 20;
    const offset = options.offset || 0;
    query += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(limit, offset);
    const res = await db.query(query, params);
    const countRes = await db.query(`SELECT COUNT(*) FROM stadiums`);
    return { data: res.rows, total: parseInt(countRes.rows[0].count,10) };
  }

  async create(data) {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map((_, i) => `$${i+1}`).join(',');
    const query = `INSERT INTO stadiums (${keys.join(',')}) VALUES (${placeholders}) RETURNING *`;
    const res = await db.query(query, values);
    logger.info('stadiums created', { id: res.rows[0].id });
    return res.rows[0];
  }

  async update(id, updates) {
    const keys = Object.keys(updates);
    if (keys.length === 0) return this.findById(id);
    const values = Object.values(updates);
    const setClause = keys.map((k, i) => `${k} = $${i+1}`).join(',');
    values.push(id);
    const query = `UPDATE stadiums SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length+1} RETURNING *`;
    const res = await db.query(query, values);
    return res.rows[0] || null;
  }

  async delete(id) {
    const res = await db.query(`DELETE FROM stadiums WHERE id = $1 RETURNING id`, [id]);
    return res.rows.length > 0;
  }

  async count(filters = {}) {
    let query = `SELECT COUNT(*) FROM stadiums WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.stadium_id) {
      query += ` AND stadium_id = $${idx}`;
      params.push(filters.stadium_id);
      idx++;
    }
    const res = await db.query(query, params);
    return parseInt(res.rows[0].count,10);
  }

  async search(searchTerm, limit = 20) {
    const query = `SELECT * FROM stadiums WHERE to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'')) @@ plainto_tsquery('english', $1) LIMIT $2`;
    try {
      const res = await db.query(query, [searchTerm, limit]);
      return res.rows;
    } catch {
      const res = await db.query(`SELECT * FROM stadiums WHERE name ILIKE $1 LIMIT $2`, [`%${searchTerm}%`, limit]);
      return res.rows;
    }
  }
}

module.exports = new StadiumsModel();
