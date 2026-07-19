const { Pool } = require('pg');
const config = require('../config');
const logger = require('./logger');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.name,
  user: config.db.user,
  password: config.db.password,
  connectionString: config.db.url || undefined,
  ssl: config.db.ssl,
  min: config.db.poolMin,
  max: config.db.poolMax,
  idleTimeoutMillis: config.db.idleTimeoutMillis,
  connectionTimeoutMillis: config.db.connectionTimeoutMillis,
});

pool.on('connect', () => {
  logger.info('PostgreSQL pool: client connected');
});

pool.on('error', (err) => {
  logger.error('PostgreSQL pool error', { error: err.message });
});

async function query(text, params) {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      logger.warn(`Slow query (${duration}ms)`, { text: text.substring(0,200) });
    }
    return result;
  } catch (error) {
    logger.error('DB query failed', { error: error.message, text: text.substring(0,200) });
    throw error;
  }
}

async function getClient() {
  const client = await pool.connect();
  const originalQuery = client.query.bind(client);
  const release = client.release.bind(client);
  
  // Timeout safety
  const timeout = setTimeout(() => {
    logger.error('Client checked out for more than 5 seconds');
  }, 5000);

  client.query = (...args) => {
    return originalQuery(...args);
  };

  client.release = () => {
    clearTimeout(timeout);
    return release();
  };

  return client;
}

async function transaction(callback) {
  const client = await getClient();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function healthCheck() {
  try {
    const res = await query('SELECT NOW() as now, COUNT(*) as stadiums FROM stadiums');
    return { ok: true, time: res.rows[0].now };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

module.exports = {
  pool,
  query,
  getClient,
  transaction,
  healthCheck,
};
