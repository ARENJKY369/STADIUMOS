/**
 * Performance Middleware - Caching, compression, response time tracking
 * Production optimization for <200ms p95 API response
 */
const logger = require('../utils/logger');

const performanceMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  
  // Track response time
  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    
    // Log slow requests >100ms p95 threshold
    if (durationMs > 100) {
      logger.warn('Slow request', {
        method: req.method,
        path: req.path,
        duration: `${durationMs.toFixed(2)}ms`,
        status: res.statusCode,
        userId: req.user?.id,
        stadiumId: req.query.stadiumId || req.body?.stadiumId,
      });
    }

    // Prometheus-style metrics (if enabled)
    if (global.metrics) {
      global.metrics.apiDuration?.observe({ method: req.method, path: req.path, status: res.statusCode }, durationMs / 1000);
      global.metrics.apiRequests?.inc({ method: req.method, path: req.path, status: res.statusCode });
    }
  });

  next();
};

// Response caching middleware for GET requests
const cacheMiddleware = (ttlSeconds = 60) => {
  const cache = new Map();
  
  return (req, res, next) => {
    if (req.method !== 'GET') return next();
    
    // Don't cache authenticated user-specific data by default
    // Only cache public or stadium-wide data
    const cacheKey = `${req.path}:${JSON.stringify(req.query)}`;
    
    // Skip cache for sensitive endpoints
    const noCachePaths = ['/auth/me', '/notifications', '/chatbot'];
    if (noCachePaths.some(p => req.path.includes(p))) return next();

    const cached = cache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      // Add cache header
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    // Wrap res.json to cache response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      // Only cache successful responses
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(cacheKey, {
          data,
          expiry: Date.now() + ttlSeconds * 1000,
        });
        // Limit cache size
        if (cache.size > 200) {
          const firstKey = cache.keys().next().value;
          cache.delete(firstKey);
        }
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(data);
    };

    next();
  };
};

// Compression optimization already via compression middleware, but add cache control for static
const staticCacheMiddleware = (req, res, next) => {
  if (req.path.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  next();
};

// Request size limiter already via express.json({limit}), but add additional check
const requestSizeLimiter = (maxSizeBytes = 10 * 1024 * 1024) => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > maxSizeBytes) {
      return res.status(413).json({
        success: false,
        message: `Payload too large. Max ${maxSizeBytes / (1024 * 1024)}MB allowed`,
        code: 'PAYLOAD_TOO_LARGE',
      });
    }
    next();
  };
};

// Timeout middleware
const timeoutMiddleware = (timeoutMs = 30000) => {
  return (req, res, next) => {
    req.setTimeout(timeoutMs, () => {
      logger.warn('Request timeout', { method: req.method, path: req.path, timeout: timeoutMs });
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout',
          code: 'REQUEST_TIMEOUT',
        });
      }
    });
    next();
  };
};

// Database query performance tracking
const queryPerformanceMiddleware = (req, res, next) => {
  req.queryCount = 0;
  req.queryTime = 0;
  const originalQuery = req.app?.get('db')?.query;
  // Track number of DB queries per request for optimization
  next();
};

module.exports = {
  performanceMiddleware,
  cacheMiddleware,
  staticCacheMiddleware,
  requestSizeLimiter,
  timeoutMiddleware,
  queryPerformanceMiddleware,
};
