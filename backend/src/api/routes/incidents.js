const express = require('express');
const router = express.Router();
const incidentService = require('../../services/incidentService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { validateIncident } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse, getPagination } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const { stadiumId, zoneId, eventId, status, severity, type, assignedTo, search, page = 1, limit = 20 } = req.query;
  const pag = getPagination(page, limit, 0);
  const { incidents, total } = await incidentService.getIncidents({
    stadiumId, zoneId, eventId, status, severity, type, assignedTo, search,
    limit: pag.perPage, offset: pag.offset,
  });
  pag.total = total;
  pag.totalPages = Math.ceil(total / pag.perPage);
  res.json(successResponse(incidents, 'Incidents retrieved', pag));
}));

router.get('/stats/:stadiumId', asyncHandler(async (req, res) => {
  const stats = await incidentService.getIncidentStats(req.params.stadiumId, req.query.eventId);
  res.json(successResponse(stats));
}));

router.get('/response-time/:stadiumId', asyncHandler(async (req, res) => {
  const metrics = await incidentService.getResponseTimeMetrics(req.params.stadiumId);
  res.json(successResponse(metrics));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const incident = await incidentService.getIncidentById(req.params.id);
  res.json(successResponse(incident));
}));

router.post('/', validateIncident, asyncHandler(async (req, res) => {
  const incident = await incidentService.createIncident(req.body, req.user.id);
  const io = req.app.get('io');
  io?.to(`stadium:${incident.stadium_id}`).emit('incident_created', incident);
  io?.to(`stadium:${incident.stadium_id}`).emit('notification', {
    type: incident.severity === 'critical' ? 'critical' : 'warning',
    title: `New ${incident.severity} incident: ${incident.title}`,
    incidentId: incident.id,
  });
  res.status(201).json(successResponse(incident, 'Incident reported'));
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const incident = await incidentService.updateIncident(req.params.id, req.body, req.user.id);
  req.app.get('io')?.to(`stadium:${incident.stadium_id}`).emit('incident_updated', incident);
  res.json(successResponse(incident, 'Incident updated'));
}));

router.patch('/:id/assign', authorizeRoles('admin','manager','security'), asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  if (!assignedTo) return res.status(400).json({ success: false, message: 'assignedTo required' });
  const incident = await incidentService.updateIncident(req.params.id, { assigned_to: assignedTo, status: 'acknowledged' });
  res.json(successResponse(incident, 'Incident assigned'));
}));

router.patch('/:id/resolve', asyncHandler(async (req, res) => {
  const { resolutionNotes } = req.body;
  const incident = await incidentService.updateIncident(req.params.id, {
    status: 'resolved',
    resolution_notes: resolutionNotes,
  });
  res.json(successResponse(incident, 'Incident resolved'));
}));

router.delete('/:id', authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const result = await incidentService.deleteIncident(req.params.id);
  res.json(successResponse(result, 'Incident deleted'));
}));

module.exports = router;
