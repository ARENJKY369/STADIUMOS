const express = require('express');
const router = express.Router();
const analyticsService = require('../../services/analyticsService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/dashboard/:stadiumId', asyncHandler(async (req, res) => {
  const stats = await analyticsService.getDashboardStats(req.params.stadiumId, req.query.eventId);
  res.json(successResponse(stats));
}));

router.get('/trends/:stadiumId', asyncHandler(async (req, res) => {
  const data = await analyticsService.getHistoricalTrends(req.params.stadiumId, req.query.period || '7d');
  res.json(successResponse(data));
}));

router.get('/incidents/timeline/:stadiumId', asyncHandler(async (req, res) => {
  const data = await analyticsService.getIncidentTimeline(req.params.stadiumId, parseInt(req.query.hours)||24);
  res.json(successResponse(data));
}));

router.get('/zones/:stadiumId', asyncHandler(async (req, res) => {
  const data = await analyticsService.getZoneAnalytics(req.params.stadiumId);
  res.json(successResponse(data));
}));

router.get('/sustainability/:stadiumId', asyncHandler(async (req, res) => {
  const data = await analyticsService.getSustainabilityAnalytics(req.params.stadiumId, req.query.eventId);
  res.json(successResponse(data));
}));

router.get('/staff/performance/:stadiumId', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const data = await analyticsService.getStaffPerformance(req.params.stadiumId);
  res.json(successResponse(data));
}));

router.post('/snapshot', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const { stadiumId, eventId, type } = req.body;
  if (!stadiumId) return res.status(400).json({ success: false, message: 'stadiumId required' });
  const snapshot = await analyticsService.createSnapshot(stadiumId, eventId, type);
  res.status(201).json(successResponse(snapshot, 'Snapshot created'));
}));

router.get('/export/:stadiumId', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const data = await analyticsService.exportData(req.params.stadiumId, req.query.format || 'json');
  res.json(successResponse(data, 'Export generated'));
}));

router.get('/kpis/:stadiumId', asyncHandler(async (req, res) => {
  const dashboard = await analyticsService.getDashboardStats(req.params.stadiumId, req.query.eventId);
  const sustainability = await analyticsService.getSustainabilityAnalytics(req.params.stadiumId, req.query.eventId);
  // Calculate KPIs
  const kpis = {
    occupancyRate: dashboard.capacity.occupancyPercent,
    incidentRate: dashboard.incidents.total ? (dashboard.incidents.active / dashboard.incidents.total * 100).toFixed(2) : 0,
    crowdSafetyScore: dashboard.crowd.avg_density ? Math.max(0, 100 - parseFloat(dashboard.crowd.avg_density)).toFixed(0) : 100,
    staffUtilization: dashboard.staff.staff_on_duty ? (dashboard.staff.staff_on_duty / 100 * 100).toFixed(0) : 0,
    sustainabilityScore: sustainability.totals?.total_points ? Math.min(100, sustainability.totals.total_points / 100) : 0,
    fanSatisfaction: 85 + Math.random()*10, // placeholder until sentiment
  };
  res.json(successResponse(kpis));
}));

module.exports = router;
