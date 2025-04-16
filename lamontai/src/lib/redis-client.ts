/**
 * Redis client with fallback mechanisms for different environments
 * 
 * This module provides a consistent API for caching across different environments:
 * - Node.js: Uses ioredis when available
 * - Edge: Uses an in-memory cache implementation
 * - Build: Uses a mock implementation
 */

// Only import Redis if we're not in an edge environment
let Redis: any;
try {
  // Dynamic import to prevent errors in edge runtime
  if (typeof process !== 'undefined' && 
      process.env.NEXT_PUBLIC_DEPLOY_ENV !== 'cloudflare' && 
      process.env.NEXT_RUNTIME !== 'edge') {
    const ioredis = require('ioredis');
    Redis = ioredis.Redis;
  }
} catch (error) {
  console.log('Redis import failed, using memory fallback:', error instanceof Error ? error.message : String(error));
}

// Check if we're in a build environment or browser
const isBuildOrBrowser = () => {
  try {
    return typeof window !== 'undefined' || 
           (typeof process !== 'undefined' && 
            process.env.NODE_ENV === 'production' && 
            process.env.NEXT_PHASE === 'phase-production-build');
  } catch (e) {
    // If there's an error accessing window or process, assume we're in a special environment
    return true;
  }
};

// Check if we're in an Edge Runtime environment
const isEdgeRuntime = () => {
  try {
    return typeof process !== 'undefined' && (
      process.env.NEXT_PUBLIC_DEPLOY_ENV === 'cloudflare' || 
      process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === 'true' ||
      process.env.NEXT_RUNTIME === 'edge'
    );
  } catch (e) {
    // If there's an error accessing process, assume we might be in an edge environment
    return true;
  }
};

/**
 * Environment-based Redis connection configuration
 */
const getRedisConfig = () => {
  try {
    return {
      REDIS_HOST: process.env.REDIS_HOST || 'localhost',
      REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),
      REDIS_PASSWORD: process.env.REDIS_PASSWORD || '',
      REDIS_DB: parseInt(process.env.REDIS_DB || '0', 10),
      REDIS_ENABLED: process.env.REDIS_ENABLED !== 'false' && !isBuildOrBrowser() && !isEdgeRuntime() && typeof Redis !== 'undefined'
    };
  } catch (e) {
    return {
      REDIS_HOST: 'localhost',
      REDIS_PORT: 6379,
      REDIS_PASSWORD: '',
      REDIS_DB: 0,
      REDIS_ENABLED: false
    };
  }
};

const config = getRedisConfig();

// Default expiration time for cache items (12 hours)
const DEFAULT_CACHE_TTL = 12 * 60 * 60; // in seconds

/**
 * Configure Redis client options
 */
const getRedisOptions = () => ({
  host: config.REDIS_HOST,
  port: config.REDIS_PORT,
  password: config.REDIS_PASSWORD,
  db: config.REDIS_DB,
  retryStrategy: (times: number) => {
    // Exponential backoff with max delay of 10 seconds
    return Math.min(times * 50, 10000);
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
});

/**
 * In-memory cache fallback when Redis is not available
 */
const memoryCache: Record<string, { value: any; expiry: number }> = {};

/**
 * Simple interface for a Redis client that can be implemented by both
 * the real Redis client and the edge-compatible mock
 */
export interface IRedisClient {
  isAlive(): boolean;
  set(key: string, value: any, ttl?: number): Promise<void>;
  get<T>(key: string): Promise<T | null>;
  delete(key: string): Promise<void>;
  getOrSet<T>(key: string, fetchFn: () => Promise<T>, ttl?: number): Promise<T>;
  clearMemoryCache(): void;
}

/**
 * Redis client class with error handling and fallback mechanisms
 */
class RedisClient implements IRedisClient {
  private redis: typeof Redis | null = null;
  private isConnected = false;
  private useMemoryFallback = false;
  
  constructor() {
    // Edge Runtime or build environment needs special handling
    if (isEdgeRuntime() || isBuildOrBrowser() || !Redis) {
      console.log('Using memory cache fallback (Edge/Build environment)');
      this.useMemoryFallback = true;
      return;
    }

    if (config.REDIS_ENABLED) {
      this.initializeRedis();
    } else {
      console.log('Redis is disabled by configuration. Using in-memory cache fallback.');
      this.useMemoryFallback = true;
    }
  }

  /**
   * Initialize Redis connection with error handling
   */
  private initializeRedis() {
    try {
      // Skip if Redis import failed or we're in edge/build environment
      if (!Redis || isEdgeRuntime() || isBuildOrBrowser()) {
        this.useMemoryFallback = true;
        return;
      }

      this.redis = new Redis(getRedisOptions());

      this.redis.on('connect', () => {
        console.log('Successfully connected to Redis');
        this.isConnected = true;
        this.useMemoryFallback = false;
      });

      this.redis.on('error', (error: Error) => {
        console.error('Redis connection error:', error.message);
        this.isConnected = false;
        this.useMemoryFallback = true;
        // We don't reconnect here as ioredis will handle reconnection automatically
      });

      this.redis.on('reconnecting', () => {
        console.log('Reconnecting to Redis...');
      });

      this.redis.on('close', () => {
        console.log('Redis connection closed');
        this.isConnected = false;
        this.useMemoryFallback = true;
      });
    } catch (error) {
      console.error('Failed to initialize Redis:', error instanceof Error ? error.message : String(error));
      this.useMemoryFallback = true;
    }
  }

  /**
   * Check if connection is alive
   */
  public isAlive(): boolean {
    return this.isConnected && this.redis !== null;
  }

  /**
   * Set a value in cache with expiration
   */
  public async set(key: string, value: any, ttl = DEFAULT_CACHE_TTL): Promise<void> {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided to cache.set');
      return;
    }
    
    try {
      // For undefined/null values, just delete the key
      if (value === undefined || value === null) {
        await this.delete(key);
        return;
      }
      
      const stringValue = JSON.stringify(value);

      if (this.isAlive() && this.redis) {
        await this.redis.set(key, stringValue, 'EX', ttl);
        return;
      }
      
      // Fallback to memory cache
      if (this.useMemoryFallback) {
        memoryCache[key] = {
          value,
          expiry: Date.now() + ttl * 1000,
        };
      }
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error instanceof Error ? error.message : String(error));
      // Fallback to memory cache on error
      memoryCache[key] = {
        value,
        expiry: Date.now() + ttl * 1000,
      };
    }
  }

  /**
   * Get a value from cache
   */
  public async get<T>(key: string): Promise<T | null> {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided to cache.get');
      return null;
    }
    
    try {
      // Try Redis first if available
      if (this.isAlive() && this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          try {
            return JSON.parse(value) as T;
          } catch (e) {
            console.error(`Error parsing cached JSON for key ${key}:`, e instanceof Error ? e.message : String(e));
            return null;
          }
        }
        return null;
      }

      // Fallback to memory cache
      if (this.useMemoryFallback && memoryCache[key]) {
        // Check if value has expired
        if (memoryCache[key].expiry > Date.now()) {
          return memoryCache[key].value as T;
        }
        // Clean up expired item
        delete memoryCache[key];
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting cache key ${key}:`, error instanceof Error ? error.message : String(error));
      
      // Try memory cache as last resort
      if (memoryCache[key] && memoryCache[key].expiry > Date.now()) {
        return memoryCache[key].value as T;
      }
      
      return null;
    }
  }

  /**
   * Delete a key from cache
   */
  public async delete(key: string): Promise<void> {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided to cache.delete');
      return;
    }
    
    try {
      if (this.isAlive() && this.redis) {
        await this.redis.del(key);
      }
      
      // Also clean up memory cache
      if (memoryCache[key]) {
        delete memoryCache[key];
      }
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Get cache with automatic refresh from source function
   */
  public async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl = DEFAULT_CACHE_TTL
  ): Promise<T> {
    if (!key || typeof key !== 'string') {
      console.error('Invalid key provided to cache.getOrSet');
      throw new Error('Invalid cache key');
    }
    
    if (typeof fetchFn !== 'function') {
      console.error('Invalid fetchFn provided to cache.getOrSet');
      throw new Error('Invalid fetch function');
    }
    
    // Try to get from cache first
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Not in cache, fetch from source
    try {
      const freshValue = await fetchFn();
      
      // Store in cache (only if value is not null/undefined)
      if (freshValue !== null && freshValue !== undefined) {
        await this.set(key, freshValue, ttl);
      }
      
      return freshValue;
    } catch (error) {
      console.error(`Error fetching data for cache key ${key}:`, error instanceof Error ? error.message : String(error));
      throw error; // Re-throw to let caller handle it
    }
  }

  /**
   * Clear memory cache
   */
  public clearMemoryCache(): void {
    Object.keys(memoryCache).forEach((key) => {
      delete memoryCache[key];
    });
  }
}

// Singleton instance - but create it lazily
let redisClientInstance: IRedisClient | null = null;

/**
 * Get a Redis client based on the current environment
 */
export async function getRedisClient(): Promise<IRedisClient> {
  // For Edge environments, use the edge-compatible client
  if (isEdgeRuntime()) {
    try {
      // Dynamic import to avoid Node.js dependencies in Edge runtime
      const edgeClient = await import('./redis-client-edge').then(module => module.default);
      return edgeClient;
    } catch (error) {
      console.error('Failed to import edge Redis client:', error instanceof Error ? error.message : String(error));
      // Create a simple in-memory client if import fails
      return createSimpleMemoryClient();
    }
  }
  
  // For other environments, use the regular Redis client
  if (!redisClientInstance) {
    redisClientInstance = new RedisClient();
  }
  
  return redisClientInstance;
}

/**
 * Create a simple in-memory client as a last resort
 */
function createSimpleMemoryClient(): IRedisClient {
  return {
    isAlive: () => false,
    set: async (key, value, ttl = DEFAULT_CACHE_TTL) => {
      memoryCache[key] = { value, expiry: Date.now() + ttl * 1000 };
    },
    get: async <T>(key: string): Promise<T | null> => {
      if (memoryCache[key] && memoryCache[key].expiry > Date.now()) {
        return memoryCache[key].value as T;
      }
      return null;
    },
    delete: async (key: string) => {
      delete memoryCache[key];
    },
    getOrSet: async <T>(key: string, fetchFn: () => Promise<T>, ttl = DEFAULT_CACHE_TTL): Promise<T> => {
      if (memoryCache[key] && memoryCache[key].expiry > Date.now()) {
        return memoryCache[key].value as T;
      }
      const value = await fetchFn();
      memoryCache[key] = { value, expiry: Date.now() + ttl * 1000 };
      return value;
    },
    clearMemoryCache: () => {
      Object.keys(memoryCache).forEach(key => {
        delete memoryCache[key];
      });
    }
  };
} 