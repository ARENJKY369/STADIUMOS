const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');
const config = require('../config');
const logger = require('../utils/logger');

class AuthService {
  async hashPassword(password) {
    return bcrypt.hash(password, config.security.bcryptRounds);
  }

  async comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
  }

  generateTokens(user) {
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      stadiumId: user.stadium_id || null,
    };
    const accessToken = jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
      issuer: config.jwt.issuer,
    });
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpiresIn,
      issuer: config.jwt.issuer,
    });
    return { accessToken, refreshToken };
  }

  async register(data) {
    const { email, password, firstName, lastName, role = 'staff', phone, language } = data;

    // Check existing
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()]);
    if (existing.rows.length > 0) {
      throw { statusCode: 409, message: 'User already exists', code: 'USER_EXISTS' };
    }

    const passwordHash = await this.hashPassword(password);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name, role, phone, language, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,$7,true) RETURNING id, email, first_name, last_name, role, created_at`,
      [email.toLowerCase(), passwordHash, firstName, lastName, role, phone, language || 'en']
    );

    const user = result.rows[0];
    logger.info('User registered', { userId: user.id, email: user.email });
    return user;
  }

  async login(email, password) {
    const result = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, role, is_active, is_verified FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw { statusCode: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    const user = result.rows[0];
    if (!user.is_active) {
      throw { statusCode: 403, message: 'Account deactivated', code: 'ACCOUNT_DEACTIVATED' };
    }

    const valid = await this.comparePassword(password, user.password_hash);
    if (!valid) {
      throw { statusCode: 401, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' };
    }

    await db.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);

    const tokens = this.generateTokens(user);
    logger.info('User logged in', { userId: user.id });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
      },
      ...tokens,
    };
  }

  async getProfile(userId) {
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.avatar_url, u.language, u.preferences, u.last_login_at, u.created_at,
              s.id as stadium_id, s.name as stadium_name
       FROM users u
       LEFT JOIN staff st ON st.user_id = u.id
       LEFT JOIN stadiums s ON s.id = st.stadium_id
       WHERE u.id = $1`,
      [userId]
    );
    if (result.rows.length === 0) throw { statusCode: 404, message: 'User not found' };
    return result.rows[0];
  }

  async updateProfile(userId, updates) {
    const allowed = ['first_name', 'last_name', 'phone', 'language', 'preferences', 'avatar_url'];
    const fields = [];
    const values = [];
    let idx = 1;
    for (const key of allowed) {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${idx}`);
        values.push(updates[key]);
        idx++;
      }
    }
    if (fields.length === 0) return this.getProfile(userId);
    values.push(userId);
    const query = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING id`;
    await db.query(query, values);
    return this.getProfile(userId);
  }

  async changePassword(userId, currentPassword, newPassword) {
    const result = await db.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) throw { statusCode: 404, message: 'User not found' };
    const valid = await this.comparePassword(currentPassword, result.rows[0].password_hash);
    if (!valid) throw { statusCode: 401, message: 'Current password incorrect' };
    const newHash = await this.hashPassword(newPassword);
    await db.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [newHash, userId]);
    logger.info('Password changed', { userId });
    return { success: true };
  }

  async listUsers(filters = {}) {
    let query = `SELECT id, email, first_name, last_name, role, is_active, created_at FROM users WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (filters.role) {
      query += ` AND role = $${idx}`;
      params.push(filters.role);
      idx++;
    }
    if (filters.search) {
      query += ` AND (email ILIKE $${idx} OR first_name ILIKE $${idx} OR last_name ILIKE $${idx})`;
      params.push(`%${filters.search}%`);
      idx++;
    }
    if (filters.isActive !== undefined) {
      query += ` AND is_active = $${idx}`;
      params.push(filters.isActive);
      idx++;
    }
    query += ` ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(filters.limit || 20, filters.offset || 0);
    const result = await db.query(query, params);
    const countResult = await db.query('SELECT COUNT(*) FROM users WHERE is_active = true');
    return { users: result.rows, total: parseInt(countResult.rows[0].count,10) };
  }
}

module.exports = new AuthService();
