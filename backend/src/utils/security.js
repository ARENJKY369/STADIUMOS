/**
 * Security Utilities - Hardening, encryption, sanitization
 * OWASP Top 10 prevention, production-ready
 */
const crypto = require('crypto');
const config = require('../config');

class SecurityUtils {
  // Input sanitization
  static sanitizeString(input) {
    if (typeof input !== 'string') return input;
    return input
      .trim()
      .replace(/[<>]/g, '') // Strip < > to prevent XSS
      .substring(0, 10000); // Limit length
  }

  static sanitizeObject(obj) {
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        // Prevent prototype pollution
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') continue;
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    if (typeof obj === 'string') {
      return this.sanitizeString(obj);
    }
    return obj;
  }

  // Encryption at rest (AES-256-GCM)
  static encrypt(text, key = config.jwt.secret) {
    const iv = crypto.randomBytes(16);
    const cipherKey = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-gcm', cipherKey, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  }

  static decrypt(encryptedText, key = config.jwt.secret) {
    try {
      const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const authTag = Buffer.from(authTagHex, 'hex');
      const cipherKey = crypto.createHash('sha256').update(key).digest();
      const decipher = crypto.createDecipheriv('aes-256-gcm', cipherKey, iv);
      decipher.setAuthTag(authTag);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      return decrypted;
    } catch (e) {
      throw new Error('Decryption failed');
    }
  }

  // Hashing for non-password (SHA-256)
  static hash(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Secure token generation
  static generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  static generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }
    return otp;
  }

  // SQL injection prevention check (basic)
  static containsSQLInjection(input) {
    const patterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|--|\/\*|\*\/|;)\b)/i,
      /('|")\s*(OR|AND)\s*('|")?\d/i,
      /(OR|AND)\s+\d+\s*=\s*\d+/i,
    ];
    return patterns.some(regex => regex.test(input));
  }

  // XSS prevention
  static escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  // Rate limiting key generation
  static getRateLimitKey(req) {
    // Use IP + user ID if authenticated for more precise limiting
    const ip = req.ip || req.connection.remoteAddress;
    const userId = req.user?.id || 'anonymous';
    return `${ip}:${userId}`;
  }

  // Validate email (strict)
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regex.test(email)) return false;
    // Additional checks: no SQL injection, length
    if (email.length > 254) return false;
    if (this.containsSQLInjection(email)) return false;
    return true;
  }

  // Password strength validation
  static isStrongPassword(password) {
    if (password.length < 8) return { valid: false, reason: 'Minimum 8 characters' };
    if (!/[a-z]/.test(password)) return { valid: false, reason: 'Need lowercase letter' };
    if (!/[A-Z]/.test(password)) return { valid: false, reason: 'Need uppercase letter' };
    if (!/\d/.test(password)) return { valid: false, reason: 'Need number' };
    if (!/[@$!%*?&]/.test(password)) return { valid: false, reason: 'Need special character @$!%*?&' };
    if (this.containsSQLInjection(password)) return { valid: false, reason: 'Invalid characters' };
    return { valid: true };
  }

  // CSRF token generation/verification (if needed)
  static generateCSRFToken() {
    return this.generateSecureToken(32);
  }

  // Audit log sanitization (remove sensitive fields)
  static sanitizeForAudit(data) {
    const sensitive = ['password', 'password_hash', 'mfa_secret', 'token', 'secret', 'key'];
    const sanitized = { ...data };
    for (const field of sensitive) {
      if (sanitized[field]) sanitized[field] = '[REDACTED]';
      // Check nested
      for (const key of Object.keys(sanitized)) {
        if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
          if (sanitized[key][field]) sanitized[key][field] = '[REDACTED]';
        }
      }
    }
    return sanitized;
  }

  // IP anonymization for GDPR
  static anonymizeIP(ip) {
    if (!ip) return null;
    // IPv4: zero last octet, IPv6: zero last group
    if (ip.includes('.')) {
      const parts = ip.split('.');
      parts[3] = '0';
      return parts.join('.');
    }
    if (ip.includes(':')) {
      const parts = ip.split(':');
      parts[parts.length - 1] = '0000';
      return parts.join(':');
    }
    return ip;
  }

  // Security headers for manual addition if not using helmet
  static getSecurityHeaders() {
    return {
      'X-DNS-Prefetch-Control': 'off',
      'X-Frame-Options': 'SAMEORIGIN',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'",
      'Referrer-Policy': 'no-referrer',
      'Permissions-Policy': 'geolocation=(self), microphone=()',
    };
  }
}

module.exports = SecurityUtils;
