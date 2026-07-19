/**
 * FIFA World Cup 2026 - Stadium Operations AI Platform
 * Express.js Backend Main Application
 * Production-ready with security, real-time, and monitoring
 */
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { Server } = require('socket.io');

const config = require('./config');
const logger = require('./utils/logger');
const db = require('./utils/db');
const { generalLimiter } = require('./middleware/rateLimiter');
const { notFoundHandler, globalErrorHandler } = require('./middleware/errorHandler');
const setupSocketIO = require('./socket');

// Import routes
const authRoutes = require('./api/routes/auth');
const eventRoutes = require('./api/routes/events');
const zoneRoutes = require('./api/routes/zones');
const crowdRoutes = require('./api/routes/crowd');
const incidentRoutes = require('./api/routes/incidents');
const notificationRoutes = require('./api/routes/notifications');
const staffRoutes = require('./api/routes/staff');
const analyticsRoutes = require('./api/routes/analytics');
const sustainabilityRoutes = require('./api/routes/sustainability');
const chatbotRoutes = require('./api/routes/chatbot');
const emergencyRoutes = require('./api/routes/emergency');
const healthRoutes = require('./api/routes/health');

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: config.security.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.set('io', io);
setupSocketIO(io);

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: config.security.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());

// Logging
app.use(morgan('combined', { stream: logger.stream }));
app.use(generalLimiter);

// Health check (before auth)
app.use('/api/health', healthRoutes);
app.use('/health', healthRoutes);

// API Routes
const apiPrefix = `/api/${config.apiVersion}`;
app.use(`${apiPrefix}/auth`, authRoutes);
app.use(`${apiPrefix}/events`, eventRoutes);
app.use(`${apiPrefix}/zones`, zoneRoutes);
app.use(`${apiPrefix}/crowd`, crowdRoutes);
app.use(`${apiPrefix}/incidents`, incidentRoutes);
app.use(`${apiPrefix}/notifications`, notificationRoutes);
app.use(`${apiPrefix}/staff`, staffRoutes);
app.use(`${apiPrefix}/analytics`, analyticsRoutes);
app.use(`${apiPrefix}/sustainability`, sustainabilityRoutes);
app.use(`${apiPrefix}/chatbot`, chatbotRoutes);
app.use(`${apiPrefix}/emergency`, emergencyRoutes);

// Swagger docs
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Stadium Operations AI Platform API',
      version: config.apiVersion,
      description: 'FIFA World Cup 2026 Operations API - Production Ready',
      contact: { name: 'Arena AI Team', email: 'support@arena.ai' },
    },
    servers: [{ url: `http://localhost:${config.port}/api/${config.apiVersion}`, description: 'Development' }],
    components: {
      securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/api/routes/*.js'],
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req, res) => res.json(swaggerSpec));

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'FIFA World Cup 2026 - Stadium Operations AI Platform API',
    version: config.apiVersion,
    environment: config.env,
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      docs: '/api/docs',
      auth: `${apiPrefix}/auth`,
      events: `${apiPrefix}/events`,
      zones: `${apiPrefix}/zones`,
      crowd: `${apiPrefix}/crowd`,
      incidents: `${apiPrefix}/incidents`,
      notifications: `${apiPrefix}/notifications`,
      staff: `${apiPrefix}/staff`,
      analytics: `${apiPrefix}/analytics`,
      sustainability: `${apiPrefix}/sustainability`,
      chatbot: `${apiPrefix}/chatbot`,
      emergency: `${apiPrefix}/emergency`,
    },
    features: config.features,
    websocket: 'Socket.IO available at same host',
  });
});

// 404 and error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    db.pool.end(() => {
      logger.info('Database pool closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    db.pool.end(() => process.exit(0));
  });
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception', { error: err.message, stack: err.stack });
  process.exit(1);
});

// Start server if run directly
if (require.main === module) {
  server.listen(config.port, () => {
    logger.info(`🚀 Stadium Operations API running`, {
      port: config.port,
      env: config.env,
      apiVersion: config.apiVersion,
      pid: process.pid,
    });
    console.log(`
╔════════════════════════════════════════════════════╗
║  FIFA World Cup 2026 - Stadium Operations Platform ║
║  API Server running at http://localhost:${config.port}       ║
║  Environment: ${config.env}                                 ║
║  Docs: http://localhost:${config.port}/api/docs             ║
║  Health: http://localhost:${config.port}/api/health          ║
║  WebSocket: Socket.IO enabled                    ║
╚════════════════════════════════════════════════════╝
    `);
  });
}

module.exports = { app, server, io };
