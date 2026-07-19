const express = require('express');
const router = express.Router();
const db = require('../../utils/db');
const config = require('../../config');

router.get('/', async (req, res) => {
  const dbHealth = await db.healthCheck();
  const status = dbHealth.ok ? 'healthy' : 'degraded';
  const code = dbHealth.ok ? 200 : 503;
  res.status(code).json({
    success: dbHealth.ok,
    status,
    timestamp: new Date().toISOString(),
    version: config.apiVersion,
    environment: config.env,
    uptime: process.uptime(),
    services: {
      database: dbHealth.ok ? 'up' : 'down',
      redis: 'up', // simplified - would check redis client
      mlService: config.ml.enablePredictions ? 'enabled' : 'disabled',
    },
    databaseTime: dbHealth.time || null,
  });
});

router.get('/ready', async (req, res) => {
  const dbHealth = await db.healthCheck();
  if (!dbHealth.ok) return res.status(503).json({ ready: false, reason: 'Database not ready' });
  res.json({ ready: true, timestamp: new Date().toISOString() });
});

router.get('/live', (req, res) => {
  res.json({ alive: true, timestamp: new Date().toISOString(), uptime: process.uptime() });
});

module.exports = router;
