const express = require('express');
const router = express.Router();
const authService = require('../../services/authService');
const { authenticateToken, authorizeRoles } = require('../../middleware/auth');
const { validateRegister, validateLogin } = require('../../middleware/validation');
const { asyncHandler } = require('../../middleware/errorHandler');
const { authLimiter } = require('../../middleware/rateLimiter');
const { successResponse } = require('../../utils/helpers');

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Authentication management
 */

// POST /api/v1/auth/register
router.post('/register', authLimiter, validateRegister, asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json(successResponse(user, 'User registered successfully'));
}));

// POST /api/v1/auth/login
router.post('/login', authLimiter, validateLogin, asyncHandler(async (req, res) => {
  const result = await authService.login(req.body.email, req.body.password);
  res.json(successResponse(result, 'Login successful'));
}));

// GET /api/v1/auth/me
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const profile = await authService.getProfile(req.user.id);
  res.json(successResponse(profile));
}));

// PUT /api/v1/auth/me
router.put('/me', authenticateToken, asyncHandler(async (req, res) => {
  const profile = await authService.updateProfile(req.user.id, req.body);
  res.json(successResponse(profile, 'Profile updated'));
}));

// POST /api/v1/auth/change-password
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Both passwords required' });
  }
  const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
  res.json(successResponse(result, 'Password changed'));
}));

// GET /api/v1/auth/users (admin/manager only)
router.get('/users', authenticateToken, authorizeRoles('admin','manager'), asyncHandler(async (req, res) => {
  const { role, search, isActive, page = 1, limit = 20 } = req.query;
  const offset = (parseInt(page)-1)*parseInt(limit);
  const { users, total } = await authService.listUsers({ role, search, isActive: isActive !== undefined ? isActive === 'true' : undefined, limit: parseInt(limit), offset });
  const pagination = { currentPage: parseInt(page), perPage: parseInt(limit), total, totalPages: Math.ceil(total/parseInt(limit)) };
  res.json(successResponse(users, 'Users retrieved', pagination));
}));

// POST /api/v1/auth/refresh
router.post('/refresh', asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });
  const jwt = require('jsonwebtoken');
  const config = require('../../config');
  try {
    const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
    const tokens = authService.generateTokens({ id: decoded.userId, email: decoded.email, role: decoded.role });
    res.json(successResponse(tokens, 'Tokens refreshed'));
  } catch (e) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
}));

module.exports = router;
