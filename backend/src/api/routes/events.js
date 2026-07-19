const express = require('express');
const router = express.Router();
const eventService = require('../../services/eventService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { validateEvent } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse, getPagination } = require('../../utils/helpers');

router.use(authenticateToken);

// GET /api/v1/events
router.get('/', asyncHandler(async (req, res) => {
  const { stadiumId, status, from, to, search, page = 1, limit = 20 } = req.query;
  const pagination = getPagination(page, limit, 0);
  const { events, total } = await eventService.getEvents({
    stadiumId, status, from, to, search,
    limit: pagination.perPage,
    offset: pagination.offset,
  });
  pagination.total = total;
  pagination.totalPages = Math.ceil(total / pagination.perPage);
  res.json(successResponse(events, 'Events retrieved', pagination));
}));

router.get('/upcoming', asyncHandler(async (req, res) => {
  const events = await eventService.getUpcomingEvents(parseInt(req.query.limit) || 5);
  res.json(successResponse(events));
}));

router.get('/live', asyncHandler(async (req, res) => {
  const events = await eventService.getLiveEvents();
  res.json(successResponse(events));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const event = await eventService.getEventById(req.params.id);
  res.json(successResponse(event));
}));

router.get('/:id/stats', asyncHandler(async (req, res) => {
  const stats = await eventService.getEventStats(req.params.id);
  res.json(successResponse(stats));
}));

router.post('/', authorizeRoles('admin','manager'), validateEvent, asyncHandler(async (req, res) => {
  const event = await eventService.createEvent(req.body, req.user.id);
  req.app.get('io')?.to(`stadium:${event.stadium_id}`).emit('event_created', event);
  res.status(201).json(successResponse(event, 'Event created'));
}));

router.put('/:id', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const event = await eventService.updateEvent(req.params.id, req.body);
  req.app.get('io')?.to(`stadium:${event.stadium_id}`).emit('event_updated', event);
  res.json(successResponse(event, 'Event updated'));
}));

router.delete('/:id', authorizeRoles('admin'), asyncHandler(async (req, res) => {
  const result = await eventService.deleteEvent(req.params.id);
  res.json(successResponse(result, 'Event deleted'));
}));

module.exports = router;
