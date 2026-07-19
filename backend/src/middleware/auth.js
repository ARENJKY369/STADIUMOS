const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../utils/db');
const logger = require('../utils/logger');

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required', code: 'TOKEN_MISSING' });
  }

  jwt.verify(token, config.jwt.secret, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token expired', code: 'TOKEN_EXPIRED' });
      }
      return res.status(403).json({ success: false, message: 'Invalid token', code: 'TOKEN_INVALID' });
    }

    try {
      // Check user still exists and active
      const result = await db.query('SELECT id, email, role, is_active FROM users WHERE id = $1', [decoded.userId]);
      if (result.rows.length === 0 || !result.rows[0].is_active) {
        return res.status(401).json({ success: false, message: 'User not found or inactive', code: 'USER_INACTIVE' });
      }

      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        stadiumId: decoded.stadiumId,
      };
      next();
    } catch (e) {
      logger.error('Auth middleware error', { error: e.message });
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }
  });
}

function authorizeRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: `Role ${req.user.role} not authorized for this resource`,
        code: 'FORBIDDEN',
        required: roles,
      });
    }
    next();
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return next();
  
  jwt.verify(token, config.jwt.secret, (err, decoded) => {
    if (!err && decoded) {
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        stadiumId: decoded.stadiumId,
      };
    }
    next();
  });
}

module.exports = {
  authenticateToken,
  authorizeRoles,
  optionalAuth,
};
