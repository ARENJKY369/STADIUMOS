const express = require('express');
const router = express.Router();
const sustainabilityService = require('../../services/sustainabilityService');
const { authenticateToken } = require('../../middleware/auth');
const { validateJoi } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse, getPagination } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const { stadiumId, eventId, category, userId, page = 1, limit = 50 } = req.query;
  const pag = getPagination(page, limit, 0);
  const data = await sustainabilityService.getMetrics({ stadiumId, eventId, category, userId, limit: pag.perPage, offset: pag.offset });
  res.json(successResponse(data));
}));

router.get('/my-stats', asyncHandler(async (req, res) => {
  const stats = await sustainabilityService.getUserEcoStats(req.user.id);
  res.json(successResponse(stats));
}));

router.get('/leaderboard/:stadiumId', asyncHandler(async (req, res) => {
  const { period = 'all', limit = 10 } = req.query;
  const leaderboard = await sustainabilityService.getLeaderboard(req.params.stadiumId, parseInt(limit), period);
  res.json(successResponse(leaderboard));
}));

router.get('/report/:stadiumId', asyncHandler(async (req, res) => {
  const report = await sustainabilityService.getCarbonReport(req.params.stadiumId, req.query.eventId);
  res.json(successResponse(report));
}));

router.get('/rewards', asyncHandler(async (req, res) => {
  const rewards = await sustainabilityService.getRewards(req.user.id);
  res.json(successResponse(rewards));
}));

router.post('/calculate-transport', asyncHandler(async (req, res) => {
  const { transportMode, distanceKm, passengers } = req.body;
  if (!transportMode || !distanceKm) return res.status(400).json({ success: false, message: 'transportMode and distanceKm required' });
  const result = await sustainabilityService.calculateTransportFootprint(transportMode, distanceKm, passengers);
  res.json(successResponse(result));
}));

router.post('/', validateJoi('sustainability'), asyncHandler(async (req, res) => {
  const metric = await sustainabilityService.logMetric({
    ...req.body,
    userId: req.user.id,
  });
  req.app.get('io')?.to(`user:${req.user.id}`).emit('eco_points_earned', { points: metric.eco_points, total: metric.eco_points });
  res.status(201).json(successResponse(metric, 'Sustainability metric logged'));
}));

router.post('/transport', asyncHandler(async (req, res) => {
  const { stadiumId, eventId, transportMode, distanceKm, passengers } = req.body;
  if (!stadiumId || !transportMode || !distanceKm) return res.status(400).json({ success: false, message: 'Required fields missing' });
  const calc = await sustainabilityService.calculateTransportFootprint(transportMode, distanceKm, passengers);
  const metric = await sustainabilityService.logMetric({
    stadiumId,
    eventId,
    userId: req.user.id,
    category: 'transport',
    metricName: `${transportMode} travel`,
    value: distanceKm,
    unit: 'km',
    transportMode,
    distanceKm,
    metadata: calc,
  });
  res.status(201).json(successResponse({ ...metric, calculation: calc }, 'Transport logged'));
}));

module.exports = router;
