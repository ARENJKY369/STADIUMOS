/**
 * Cache Service - Redis based caching with TTL, invalidation, metrics
 * Used for crowd heatmap, leaderboard, translations, session
 */
const redis = require('redis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.hits = 0;
    this.misses = 0;
    this.memoryCache = new Map(); // Fallback in-memory cache if Redis unavailable
    this.init();
  }

  async init() {
    try {
      this.client = redis.createClient({
        url: config.redis.url,
        socket: {
          host: config.redis.host,
          port: config.redis.port,
          reconnectStrategy: (retries) => {
            if (retries > 5) {
              logger.warn('Redis max retries exceeded, using memory cache');
              return false;
            }
            return Math.min(retries * 100, 3000);
          },
        },
        password: config.redis.password || undefined,
        database: config.redis.db,
      });

      this.client.on('error', (err) => {
        logger.warn('Redis error, falling back to memory cache', { error: err.message });
        this.connected = false;
      });

      this.client.on('connect', () => {
        logger.info('Redis connected for caching');
        this.connected = true;
      });

      await this.client.connect().catch(() => {
        logger.warn('Redis connection failed, using memory cache');
        this.connected = false;
      });
    } catch (e) {
      logger.warn('CacheService init failed, using memory', { error: e.message });
      this.connected = false;
    }
  }

  async get(key) {
    try {
      if (this.connected && this.client?.isOpen) {
        const value = await this.client.get(key);
        if (value !== null) {
          this.hits++;
          return JSON.parse(value);
        }
        this.misses++;
        return null;
      } else {
        // Memory fallback
        const entry = this.memoryCache.get(key);
        if (!entry) {
          this.misses++;
          return null;
        }
        if (entry.expiry && Date.now() > entry.expiry) {
          this.memoryCache.delete(key);
          this.misses++;
          return null;
        }
        this.hits++;
        return entry.value;
      }
    } catch (e) {
      logger.warn('Cache get error', { key, error: e.message });
      this.misses++;
      return null;
    }
  }

  async set(key, value, ttlSeconds = 300) {
    try {
      const serialized = JSON.stringify(value);
      if (this.connected && this.client?.isOpen) {
        if (ttlSeconds) {
          await this.client.setEx(key, ttlSeconds, serialized);
        } else {
          await this.client.set(key, serialized);
        }
      } else {
        // Memory fallback
        this.memoryCache.set(key, {
          value,
          expiry: ttlSeconds ? Date.now() + ttlSeconds * 1000 : null,
        });
        // Limit memory cache size
        if (this.memoryCache.size > 500) {
          const firstKey = this.memoryCache.keys().next().value;
          this.memoryCache.delete(firstKey);
        }
      }
      return true;
    } catch (e) {
      logger.warn('Cache set error', { key, error: e.message });
      return false;
    }
  }

  async del(key) {
    try {
      if (this.connected && this.client?.isOpen) {
        await this.client.del(key);
      } else {
        this.memoryCache.delete(key);
      }
      return true;
    } catch (e) {
      logger.warn('Cache del error', { error: e.message });
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      if (this.connected && this.client?.isOpen) {
        // SCAN for keys matching pattern
        let cursor = 0;
        do {
          const reply = await this.client.scan(cursor, { MATCH: pattern, COUNT: 100 });
          cursor = reply.cursor;
          if (reply.keys.length > 0) {
            await this.client.del(reply.keys);
          }
        } while (cursor !== 0);
      } else {
        // Memory: delete keys that include pattern substring
        const regex = new RegExp(pattern.replace('*', '.*'));
        for (const key of this.memoryCache.keys()) {
          if (regex.test(key)) this.memoryCache.delete(key);
        }
      }
      return true;
    } catch (e) {
      logger.warn('Cache delPattern error', { error: e.message });
      return false;
    }
  }

  async exists(key) {
    try {
      if (this.connected && this.client?.isOpen) {
        const result = await this.client.exists(key);
        return result === 1;
      } else {
        return this.memoryCache.has(key);
      }
    } catch {
      return false;
    }
  }

  async ttl(key) {
    try {
      if (this.connected && this.client?.isOpen) {
        return await this.client.ttl(key);
      } else {
        const entry = this.memoryCache.get(key);
        if (!entry || !entry.expiry) return -1;
        return Math.floor((entry.expiry - Date.now()) / 1000);
      }
    } catch {
      return -1;
    }
  }

  async incr(key, by = 1) {
    try {
      if (this.connected && this.client?.isOpen) {
        return await this.client.incrBy(key, by);
      } else {
        const current = this.memoryCache.get(key)?.value || 0;
        const newVal = parseInt(current,10) + by;
        this.memoryCache.set(key, { value: newVal, expiry: null });
        return newVal;
      }
    } catch {
      return by;
    }
  }

  // Specialized helpers for common use cases
  async getOrSet(key, fetchFn, ttl = 300) {
    const cached = await this.get(key);
    if (cached !== null) return cached;
    
    const fresh = await fetchFn();
    await this.set(key, fresh, ttl);
    return fresh;
  }

  async cacheCrowdHeatmap(stadiumId, data) {
    return this.set(`crowd:heatmap:${stadiumId}`, data, 30); // 30s TTL for real-time
  }

  async getCrowdHeatmap(stadiumId) {
    return this.get(`crowd:heatmap:${stadiumId}`);
  }

  async cacheLeaderboard(stadiumId, data) {
    return this.set(`sustainability:leaderboard:${stadiumId}`, data, 60); // 1 min
  }

  async getLeaderboard(stadiumId) {
    return this.get(`sustainability:leaderboard:${stadiumId}`);
  }

  async cacheTranslation(fromLang, toLang, original, translated) {
    const key = `translation:${fromLang}:${toLang}:${original.substring(0,100)}`;
    return this.set(key, { translated, original }, 3600); // 1 hour
  }

  async getTranslation(fromLang, toLang, original) {
    const key = `translation:${fromLang}:${toLang}:${original.substring(0,100)}`;
    return this.get(key);
  }

  async invalidateStadiumCache(stadiumId) {
    await this.delPattern(`crowd:*:${stadiumId}*`);
    await this.delPattern(`zones:*:${stadiumId}*`);
    await this.delPattern(`analytics:*:${stadiumId}*`);
    await this.del(`stadium:stats:${stadiumId}`);
    logger.info('Stadium cache invalidated', { stadiumId });
  }

  getStats() {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      connected: this.connected,
      memoryCacheSize: this.memoryCache.size,
    };
  }

  async flushAll() {
    try {
      if (this.connected && this.client?.isOpen) {
        await this.client.flushDb();
      }
      this.memoryCache.clear();
      this.hits = 0;
      this.misses = 0;
      logger.warn('Cache flushed');
      return true;
    } catch (e) {
      logger.error('Cache flush failed', { error: e.message });
      return false;
    }
  }
}

module.exports = new CacheService();
