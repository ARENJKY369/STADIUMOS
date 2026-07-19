/**
 * Configuration Management
 * Centralized configuration with validation
 */
require('dotenv').config();
const path = require('path');

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  appName: process.env.APP_NAME || 'Stadium Operations AI Platform',
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    name: process.env.DB_NAME || 'stadium_ops',
    user: process.env.DB_USER || 'stadium_user',
    password: process.env.DB_PASSWORD || 'stadium_pass',
    url: process.env.DATABASE_URL,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    poolMin: parseInt(process.env.DB_POOL_MIN, 10) || 2,
    poolMax: parseInt(process.env.DB_POOL_MAX, 10) || 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0,
    retryAttempts: 5,
    retryDelay: 1000,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-jwt-secret-key-for-development-only-64-chars-min-required-change-prod',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-key-for-development-only-64-chars-min',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    issuer: 'stadium-ops-api',
  },

  // Security
  security: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS, 10) || 12,
    corsOrigin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:3000'],
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10) || 15 * 60 * 1000,
    rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10) || 100,
    rateLimitAuthMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX, 10) || 10,
  },

  // External APIs
  apis: {
    claudeKey: process.env.CLAUDE_API_KEY || '',
    openaiKey: process.env.OPENAI_API_KEY || '',
    googleMapsKey: process.env.GOOGLE_MAPS_API_KEY || '',
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID || '',
      authToken: process.env.TWILIO_AUTH_TOKEN || '',
      phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    },
    sendgridKey: process.env.SENDGRID_API_KEY || '',
  },

  // ML Service
  ml: {
    serviceUrl: process.env.ML_SERVICE_URL || 'http://localhost:8000',
    apiKey: process.env.ML_API_KEY || 'ml-internal-key',
    enablePredictions: process.env.ENABLE_ML_PREDICTIONS !== 'false',
  },

  // Feature Flags
  features: {
    chatbot: process.env.ENABLE_CHATBOT !== 'false',
    analytics: process.env.ENABLE_ANALYTICS !== 'false',
    sustainability: process.env.ENABLE_SUSTAINABILITY !== 'false',
    pushNotifications: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    format: process.env.LOG_FORMAT || 'json',
    sentryDsn: process.env.SENTRY_DSN || '',
  },

  // Tournament
  tournament: {
    startDate: process.env.TOURNAMENT_START_DATE || '2026-06-11',
    endDate: process.env.TOURNAMENT_END_DATE || '2026-07-19',
    supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,es,fr').split(','),
    defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  },

  // Upload & Storage
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4'],
    destination: path.join(__dirname, '../../uploads'),
    s3Bucket: process.env.AWS_S3_BUCKET || '',
  },
};

// Validation
const requiredInProduction = ['JWT_SECRET', 'CLAUDE_API_KEY'];
if (config.env === 'production') {
  const missing = requiredInProduction.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`WARNING: Missing env vars in production: ${missing.join(', ')} using defaults is not recommended`);
  }
}

module.exports = config;
