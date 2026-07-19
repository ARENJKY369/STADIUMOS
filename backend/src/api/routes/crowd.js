const express = require('express');
const router = express.Router();
const crowdService = require('../../services/crowdService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { validateJoi } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const { stadiumId, zoneId, eventId, from, to, anomalyOnly, page = 1, limit = 100 } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const metrics = await crowdService.getMetrics({ stadiumId, zoneId, eventId, from, to, anomalyOnly: anomalyOnly === 'true', limit: parseInt(limit), offset });
  res.json(successResponse(metrics));
}));

router.get('/heatmap/:stadiumId', asyncHandler(async (req, res) => {
  const { eventId } = req.query;
  const data = await crowdService.getHeatmapData(req.params.stadiumId, eventId);
  res.json(successResponse(data, 'Heatmap data retrieved'));
}));

router.get('/anomalies/:stadiumId', asyncHandler(async (req, res) => {
  const data = await crowdService.getAnomalies(req.params.stadiumId, parseInt(req.query.limit)||20);
  res.json(successResponse(data));
}));

router.get('/peaks/:stadiumId', asyncHandler(async (req, res) => {
  const data = await crowdService.getPeakHours(req.params.stadiumId, req.query.eventId);
  res.json(successResponse(data));
}));

router.get('/predict/:zoneId', asyncHandler(async (req, res) => {
  const { stadiumId, minutes = 30 } = req.query;
  if (!stadiumId) return res.status(400).json({ success: false, message: 'stadiumId required' });
  const prediction = await crowdService.predictCrowd(stadiumId, req.params.zoneId, parseInt(minutes));
  res.json(successResponse(prediction, 'Prediction generated'));
}));

router.post('/', authorizeRoles('admin','manager','staff','security'), validateJoi('crowdMetric'), asyncHandler(async (req, res) => {
  const metric = await crowdService.recordMetrics(req.body);
  req.app.get('io')?.to(`stadium:${metric.stadium_id}`).emit('crowd_update', metric);
  if (metric.is_anomaly) {
    req.app.get('io')?.to(`stadium:${metric.stadium_id}`).emit('crowd_anomaly', metric);
  }
  res.status(201).json(successResponse(metric, 'Metric recorded'));
}));

router.post('/bulk', authorizeRoles('admin','manager','staff'), asyncHandler(async (req, res) => {
  const { metrics } = req.body;
  if (!Array.isArray(metrics)) return res.status(400).json({ success: false, message: 'metrics array required' });
  const results = [];
  for (const m of metrics) {
    try {
      const recorded = await crowdService.recordMetrics(m);
      results.push(recorded);
    } catch (e) {
      results.push({ error: e.message, data: m });
    }
  }
  req.app.get('io')?.to(`stadium:${metrics[0]?.stadiumId}`).emit('crowd_bulk_update', results);
  res.json(successResponse(results, `${results.length} metrics processed`));
}));

module.exports = router;
