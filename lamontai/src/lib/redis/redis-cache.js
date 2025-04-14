/**
 * Redis caching utility for API responses
 * This module provides functions to cache API responses in Redis
 */

// Import Redis client
const Redis = require('ioredis');
const { serialize, deserialize } = require('v8');

// Redis client configuration
const redis = process.env.REDIS_URL 
  ? new Redis(process.env.REDIS_URL)
  : new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });

// Default TTL for cache items (in seconds)
const DEFAULT_TTL = 3600; // 1 hour

redis.on('error', (err) => {
  console.error('Redis connection error:', err);
});

/**
 * Set a value in the cache
 * @param {string} key - The cache key
 * @param {any} value - The value to cache
 * @param {number} ttl - Time to live in seconds
 */
async function set(key, value, ttl = DEFAULT_TTL) {
  try {
    // For complex objects, serialize to prevent data corruption
    const isComplex = typeof value === 'object' && value !== null;
    const serializedValue = isComplex ? serialize(value).toString('base64') : JSON.stringify(value);
    
    await redis.set(key, serializedValue, 'EX', ttl);
    return true;
  } catch (error) {
    console.error(`Redis cache set error for key ${key}:`, error);
    return false;
  }
}

/**
 * Get a value from the cache
 * @param {string} key - The cache key
 * @returns {Promise<any>} - The cached value or null if not found
 */
async function get(key) {
  try {
    const result = await redis.get(key);
    
    if (!result) return null;
    
    try {
      // Try to parse as JSON first
      return JSON.parse(result);
    } catch (err) {
      // If that fails, try to deserialize from base64
      try {
        const buffer = Buffer.from(result, 'base64');
        return deserialize(buffer);
      } catch (deserializeErr) {
        // If all parsing fails, return as string
        return result;
      }
    }
  } catch (error) {
    console.error(`Redis cache get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Delete a value from the cache
 * @param {string} key - The cache key
 */
async function del(key) {
  try {
    await redis.del(key);
    return true;
  } catch (error) {
    console.error(`Redis cache delete error for key ${key}:`, error);
    return false;
  }
}

/**
 * Clear all cache entries with a specific prefix
 * @param {string} prefix - The key prefix to match
 */
async function clearByPrefix(prefix) {
  try {
    const keys = await redis.keys(`${prefix}*`);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
    return true;
  } catch (error) {
    console.error(`Redis cache clear by prefix error for ${prefix}:`, error);
    return false;
  }
}

/**
 * Cache API response with Redis wrapper
 * @param {Function} handler - API route handler function
 * @param {Object} options - Caching options
 * @returns {Function} - Wrapped handler function with caching
 */
function cacheApiResponse(handler, options = {}) {
  const {
    ttl = DEFAULT_TTL,
    keyPrefix = 'api:',
    keyGenerator = (req) => `${keyPrefix}${req.url}`,
    shouldCache = () => true,
  } = options;

  return async (req, res) => {
    // Only cache GET requests by default
    if (req.method !== 'GET' || !shouldCache(req)) {
      return handler(req, res);
    }

    const cacheKey = keyGenerator(req);
    
    try {
      // Try to get from cache first
      const cachedData = await get(cacheKey);
      
      if (cachedData) {
        // Add cache header for debugging
        res.setHeader('X-Cache', 'HIT');
        return res.status(200).json(cachedData);
      }
      
      // Not in cache, set header and call original handler
      res.setHeader('X-Cache', 'MISS');
      
      // Store original json method
      const originalJson = res.json;
      
      // Override json method to intercept the response
      res.json = function(data) {
        // Cache the response data
        set(cacheKey, data, ttl).catch(console.error);
        
        // Call the original json method
        return originalJson.call(this, data);
      };
      
      return handler(req, res);
    } catch (error) {
      console.error('Cache wrapper error:', error);
      // If caching fails, just call the handler directly
      return handler(req, res);
    }
  };
}

module.exports = {
  redis,
  set,
  get, 
  del,
  clearByPrefix,
  cacheApiResponse
}; 