const express = require('express');
const router = express.Router();
const zoneService = require('../../services/zoneService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { validateZone } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse, getPagination } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const { stadiumId, type, status, search, page = 1, limit = 50 } = req.query;
  const pag = getPagination(page, limit, 0);
  const { zones, total } = await zoneService.getZones({ stadiumId, type, status, search, limit: pag.perPage, offset: pag.offset });
  pag.total = total;
  pag.totalPages = Math.ceil(total / pag.perPage);
  res.json(successResponse(zones, 'Zones retrieved', pag));
}));

router.get('/occupancy/:stadiumId', asyncHandler(async (req, res) => {
  const data = await zoneService.getZoneOccupancy(req.params.stadiumId);
  res.json(successResponse(data));
}));

router.get('/critical/:stadiumId', asyncHandler(async (req, res) => {
  const threshold = parseInt(req.query.threshold) || 80;
  const data = await zoneService.getCriticalZones(req.params.stadiumId, threshold);
  res.json(successResponse(data));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const zone = await zoneService.getZoneById(req.params.id);
  res.json(successResponse(zone));
}));

router.post('/', authorizeRoles('admin','manager'), validateZone, asyncHandler(async (req, res) => {
  const zone = await zoneService.createZone(req.body);
  req.app.get('io')?.to(`stadium:${zone.stadium_id}`).emit('zone_created', zone);
  res.status(201).json(successResponse(zone, 'Zone created'));
}));

router.put('/:id', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const zone = await zoneService.updateZone(req.params.id, req.body);
  req.app.get('io')?.to(`stadium:${zone.stadium_id}`).emit('zone_updated', zone);
  res.json(successResponse(zone, 'Zone updated'));
}));

router.patch('/:id/occupancy', authorizeRoles('admin','manager','staff','security'), asyncHandler(async (req, res) => {
  const { occupancyCount } = req.body;
  if (occupancyCount === undefined) return res.status(400).json({ success: false, message: 'occupancyCount required' });
  const zone = await zoneService.updateOccupancy(req.params.id, occupancyCount);
  req.app.get('io')?.to(`stadium:${zone.stadium_id}`).emit('zone_occupancy_updated', zone);
  res.json(successResponse(zone, 'Occupancy updated'));
}));

router.delete('/:id', authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const result = await zoneService.deleteZone(req.params.id);
  res.json(successResponse(result, 'Zone deleted'));
}));

module.exports = router;
