const express = require('express');
const router = express.Router();
const db = require('../../utils/db');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { asyncHandler } = require('../../middleware/errorHandler');
const { successResponse, getPagination } = require('../../utils/helpers');

router.use(authenticateToken);

router.get('/', asyncHandler(async (req, res) => {
  const { stadiumId, department, onDuty, search, page = 1, limit = 20 } = req.query;
  let query = `SELECT st.*, u.first_name, u.last_name, u.email, u.role, z.name as zone_name FROM staff st JOIN users u ON u.id = st.user_id LEFT JOIN zones z ON z.id = st.current_zone_id WHERE 1=1`;
  const params = []; let idx = 1;
  if (stadiumId) { query += ` AND st.stadium_id = $${idx}`; params.push(stadiumId); idx++; }
  if (department) { query += ` AND st.department ILIKE $${idx}`; params.push(`%${department}%`); idx++; }
  if (onDuty !== undefined) { query += ` AND st.is_on_duty = $${idx}`; params.push(onDuty === 'true'); idx++; }
  if (search) { query += ` AND (u.first_name ILIKE $${idx} OR u.last_name ILIKE $${idx} OR u.email ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
  const countQ = `SELECT COUNT(*) FROM (${query}) as c`;
  const countRes = await db.query(countQ, params);
  const total = parseInt(countRes.rows[0].count,10);
  const pag = getPagination(page, limit, total);
  query += ` ORDER BY st.is_on_duty DESC, u.first_name LIMIT $${idx} OFFSET $${idx+1}`;
  params.push(pag.perPage, pag.offset);
  const reslt = await db.query(query, params);
  res.json(successResponse(reslt.rows, 'Staff retrieved', pag));
}));

router.get('/on-duty/:stadiumId', asyncHandler(async (req, res) => {
  const result = await db.query(`SELECT * FROM v_staff_on_duty WHERE stadium_id = $1 ORDER BY zone_name`, [req.params.stadiumId]);
  res.json(successResponse(result.rows));
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const result = await db.query(
    `SELECT st.*, u.first_name, u.last_name, u.email, s.name as stadium_name FROM staff st JOIN users u ON u.id = st.user_id JOIN stadiums s ON s.id = st.stadium_id WHERE st.id = $1`,
    [req.params.id]
  );
  if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Staff not found' });
  const assignments = await db.query(`SELECT * FROM staff_assignments WHERE staff_id = $1 ORDER BY start_time DESC LIMIT 10`, [req.params.id]);
  res.json(successResponse({ ...result.rows[0], recentAssignments: assignments.rows }));
}));

router.post('/', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const { userId, stadiumId, employeeId, department, position, skills, currentZoneId } = req.body;
  if (!userId || !stadiumId || !employeeId || !department) return res.status(400).json({ success: false, message: 'Required fields missing' });
  const result = await db.query(
    `INSERT INTO staff (user_id, stadium_id, employee_id, department, position, skills, current_zone_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [userId, stadiumId, employeeId, department, position, skills, currentZoneId]
  );
  res.status(201).json(successResponse(result.rows[0], 'Staff created'));
}));

router.put('/:id', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const allowed = ['department','position','skills','certifications','current_zone_id','is_on_duty','performance_rating'];
  const fields = []; const values = []; let idx =1;
  for (const k of allowed) { if (req.body[k] !== undefined) { fields.push(`${k} = $${idx}`); values.push(req.body[k]); idx++; } }
  if (fields.length ===0) return res.status(400).json({ success: false, message: 'No fields to update' });
  values.push(req.params.id);
  const result = await db.query(`UPDATE staff SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`, values);
  if (result.rows.length===0) return res.status(404).json({ success: false, message: 'Staff not found' });
  res.json(successResponse(result.rows[0], 'Staff updated'));
}));

router.post('/:id/checkin', asyncHandler(async (req, res) => {
  const { zoneId } = req.body;
  const result = await db.query(
    `UPDATE staff SET is_on_duty = true, duty_start = NOW(), current_zone_id = COALESCE($1, current_zone_id), updated_at = NOW() WHERE id = $2 RETURNING *`,
    [zoneId, req.params.id]
  );
  if (result.rows.length===0) return res.status(404).json({ success: false, message: 'Staff not found' });
  req.app.get('io')?.to(`stadium:${result.rows[0].stadium_id}`).emit('staff_checkin', result.rows[0]);
  res.json(successResponse(result.rows[0], 'Checked in'));
}));

router.post('/:id/checkout', asyncHandler(async (req, res) => {
  const result = await db.query(
    `UPDATE staff SET is_on_duty = false, duty_end = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
    [req.params.id]
  );
  if (result.rows.length===0) return res.status(404).json({ success: false, message: 'Staff not found' });
  res.json(successResponse(result.rows[0], 'Checked out'));
}));

// Assignments
router.get('/:id/assignments', asyncHandler(async (req, res) => {
  const result = await db.query(`SELECT sa.*, z.name as zone_name FROM staff_assignments sa LEFT JOIN zones z ON z.id = sa.zone_id WHERE sa.staff_id = $1 ORDER BY sa.start_time DESC`, [req.params.id]);
  res.json(successResponse(result.rows));
}));

router.post('/assignments', authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const { staffId, stadiumId, zoneId, eventId, taskTitle, taskDescription, startTime, endTime, priority } = req.body;
  if (!staffId || !stadiumId || !taskTitle || !startTime || !endTime) return res.status(400).json({ success: false, message: 'Required fields missing' });
  const result = await db.query(
    `INSERT INTO staff_assignments (staff_id, stadium_id, zone_id, event_id, task_title, task_description, start_time, end_time, priority, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [staffId, stadiumId, zoneId, eventId, taskTitle, taskDescription, startTime, endTime, priority||1, req.user.id]
  );
  res.status(201).json(successResponse(result.rows[0], 'Assignment created'));
}));

module.exports = router;
