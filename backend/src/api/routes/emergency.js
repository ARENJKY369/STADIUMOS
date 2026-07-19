const express = require('express');
const router = express.Router();
const db = require('../../utils/db');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse } = require('../../utils/helpers');
const notificationService = require('../../services/notificationService');

router.use(authenticateToken);

// Emergency alert broadcast
router.post('/alert', authorizeRoles('admin','manager','security'), asyncHandler(async (req, res) => {
  const { stadiumId, title, message, severity = 'critical', zones, evacuationRequired = false } = req.body;
  if (!stadiumId || !title || !message) return res.status(400).json({ success: false, message: 'Missing required fields' });

  // Create incident for tracking
  const incidentRes = await db.query(
    `INSERT INTO incidents (stadium_id, type, severity, title, description, status) VALUES ($1,'safety',$2,$3,$4,'reported') RETURNING *`,
    [stadiumId, severity, title, message]
  );

  const alert = await notificationService.sendEmergencyAlert({
    stadiumId,
    title: `🚨 EMERGENCY: ${title}`,
    message,
    zones,
    priority: 5,
  }, req.app.get('io'));

  // If evacuation, update zones
  if (evacuationRequired && zones?.length) {
    await db.query(`UPDATE zones SET status = 'evacuation' WHERE id = ANY($1)`, [zones]);
  }

  req.app.get('io')?.to(`stadium:${stadiumId}`).emit('emergency_alert', {
    incident: incidentRes.rows[0],
    alert,
    evacuationRequired,
    timestamp: new Date().toISOString(),
  });

  res.status(201).json(successResponse({ incident: incidentRes.rows[0], alert }, 'Emergency alert broadcasted'));
}));

router.post('/evacuate', authorizeRoles('admin','manager','security'), asyncHandler(async (req, res) => {
  const { stadiumId, zoneIds, reason } = req.body;
  if (!stadiumId || !zoneIds) return res.status(400).json({ success: false, message: 'stadiumId and zoneIds required' });
  
  await db.query(`UPDATE zones SET status = 'evacuation', updated_at = NOW() WHERE id = ANY($1)`, [zoneIds]);
  
  const zonesRes = await db.query(`SELECT name FROM zones WHERE id = ANY($1)`, [zoneIds]);
  const zoneNames = zonesRes.rows.map(r => r.name).join(', ');

  const alert = await notificationService.sendEmergencyAlert({
    stadiumId,
    title: `Evacuation Order - ${zoneNames}`,
    message: reason || `Immediate evacuation required for zones: ${zoneNames}. Follow staff instructions to nearest exit.`,
    zones: zoneIds,
    priority: 5,
  }, req.app.get('io'));

  res.json(successResponse({ evacuatedZones: zoneIds, alert }, 'Evacuation initiated'));
}));

router.post('/lockdown', authorizeRoles('admin','security'), asyncHandler(async (req, res) => {
  const { stadiumId, zoneIds, reason } = req.body;
  if (!stadiumId) return res.status(400).json({ success: false, message: 'stadiumId required' });

  const targetZones = zoneIds?.length ? zoneIds : (await db.query(`SELECT id FROM zones WHERE stadium_id = $1`, [stadiumId])).rows.map(r=>r.id);
  await db.query(`UPDATE zones SET status = 'restricted', updated_at = NOW() WHERE id = ANY($1)`, [targetZones]);

  const alert = await notificationService.sendEmergencyAlert({
    stadiumId,
    title: 'Lockdown Initiated',
    message: reason || 'Stadium lockdown in effect. Please remain in your current location and follow staff instructions.',
    zones: targetZones,
  }, req.app.get('io'));

  res.json(successResponse({ lockedZones: targetZones, alert }, 'Lockdown initiated'));
}));

router.post('/resolve', authorizeRoles('admin','manager','security'), asyncHandler(async (req, res) => {
  const { stadiumId, incidentId, resolutionNotes } = req.body;
  if (!stadiumId) return res.status(400).json({ success: false, message: 'stadiumId required' });

  if (incidentId) {
    await db.query(`UPDATE incidents SET status = 'resolved', resolution_notes = $1, resolved_at = NOW() WHERE id = $2`, [resolutionNotes, incidentId]);
  }

  // Reopen zones if they were in evacuation
  await db.query(`UPDATE zones SET status = 'open', updated_at = NOW() WHERE stadium_id = $1 AND status = 'evacuation'`, [stadiumId]);

  req.app.get('io')?.to(`stadium:${stadiumId}`).emit('emergency_resolved', {
    message: 'Emergency situation resolved. Zones reopened.',
    timestamp: new Date().toISOString(),
  });

  res.json(successResponse({ success: true }, 'Emergency resolved'));
}));

router.get('/active/:stadiumId', asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT i.*, z.name as zone_name FROM incidents i LEFT JOIN zones z ON z.id = i.zone_id WHERE i.stadium_id = $1 AND i.status IN ('reported','acknowledged','in_progress') AND i.severity IN ('high','critical') ORDER BY i.created_at DESC`,
    [req.params.stadiumId]
  );
  const evacZones = await db.query(`SELECT id, name, code FROM zones WHERE stadium_id = $1 AND status = 'evacuation'`, [req.params.stadiumId]);
  res.json(successResponse({ activeCriticalIncidents: result.rows, evacuationZones: evacZones.rows }));
}));

router.get('/protocol/:type', asyncHandler(async (req, res) => {
  const protocols = {
    medical: {
      steps: ['Assess scene safety', 'Call medical team', 'Provide first aid if trained', 'Clear area', 'Document incident', 'Follow up'],
      contacts: ['Medical Lead', 'Security', 'Stadium Manager'],
    },
    evacuation: {
      steps: ['Trigger alarm', 'Announce evacuation via PA', 'Guide crowd to exits', 'Account for staff', 'Lock zones', 'Rendezvous at muster point'],
      contacts: ['Security Lead', 'Safety Officer', 'Emergency Services'],
    },
    security: {
      steps: ['Assess threat level', 'Contact security lead', 'Isolate area if safe', 'Notify police if needed', 'Broadcast warning', 'Document'],
      contacts: ['Security Lead', 'Police Liaison', 'Stadium Manager'],
    },
  };
  res.json(successResponse(protocols[req.params.type] || protocols.medical));
}));

module.exports = router;
