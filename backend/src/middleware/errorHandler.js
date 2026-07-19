const logger = require('../utils/logger');
const config = require('../config');

function notFoundHandler(req, res, next) {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND',
    timestamp: new Date().toISOString(),
  });
}

// eslint-disable-next-line no-unused-vars
function globalErrorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    code = 'VALIDATION_ERROR';
  }
  if (err.code === '23505') { // Postgres unique violation
    statusCode = 409;
    message = 'Resource already exists';
    code = 'DUPLICATE_RESOURCE';
  }
  if (err.code === '23503') { // Foreign key violation
    statusCode = 400;
    message = 'Invalid reference to related resource';
    code = 'INVALID_REFERENCE';
  }

  logger.error('Global error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
    statusCode,
  });

  const response = {
    success: false,
    message,
    code,
    timestamp: new Date().toISOString(),
  };

  if (config.env === 'development') {
    response.stack = err.stack;
    response.details = err.details || null;
  }

  res.status(statusCode).json(response);
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFoundHandler,
  globalErrorHandler,
  asyncHandler,
};
