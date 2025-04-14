import { Redis } from 'ioredis';

/**
 * Environment-based Redis connection configuration
 */
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || '';
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_ENABLED = process.env.REDIS_ENABLED !== 'false';

// Default expiration time for cache items (12 hours)
const DEFAULT_CACHE_TTL = 12 * 60 * 60; // in seconds

/**
 * Configure Redis client options
 */
const redisOptions = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  password: REDIS_PASSWORD,
  db: REDIS_DB,
  retryStrategy: (times: number) => {
    // Exponential backoff with max delay of 10 seconds
    return Math.min(times * 50, 10000);
  },
  enableOfflineQueue: true,
  maxRetriesPerRequest: 3,
};

/**
 * In-memory cache fallback when Redis is not available
 */
const memoryCache: Record<string, { value: any; expiry: number }> = {};

/**
 * Redis client class with error handling and fallback mechanisms
 */
class RedisClient {
  private redis: Redis | null = null;
  private isConnected = false;
  private useMemoryFallback = false;

  constructor() {
    if (REDIS_ENABLED) {
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
      this.redis = new Redis(redisOptions);

      this.redis.on('connect', () => {
        console.log('Successfully connected to Redis');
        this.isConnected = true;
        this.useMemoryFallback = false;
      });

      this.redis.on('error', (error) => {
        console.error('Redis connection error:', error);
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
      console.error('Failed to initialize Redis:', error);
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
    try {
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
      console.error(`Error setting cache key ${key}:`, error);
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
    try {
      // Try Redis first if available
      if (this.isAlive() && this.redis) {
        const value = await this.redis.get(key);
        if (value) {
          return JSON.parse(value) as T;
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
      console.error(`Error getting cache key ${key}:`, error);
      
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
    try {
      if (this.isAlive() && this.redis) {
        await this.redis.del(key);
      }
      
      // Also clean up memory cache
      if (memoryCache[key]) {
        delete memoryCache[key];
      }
    } catch (error) {
      console.error(`Error deleting cache key ${key}:`, error);
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
    // Try to get from cache first
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== null) {
      return cachedValue;
    }
    
    // Not in cache, fetch from source
    try {
      const freshValue = await fetchFn();
      
      // Store in cache
      await this.set(key, freshValue, ttl);
      
      return freshValue;
    } catch (error) {
      console.error(`Error fetching data for cache key ${key}:`, error);
      throw error; // Re-throw to let caller handle it
    }
  }

  /**
   * Clear memory cache on Redis reconnection
   */
  public clearMemoryCache(): void {
    Object.keys(memoryCache).forEach((key) => {
      delete memoryCache[key];
    });
  }
}

// Export singleton instance
const redisClient = new RedisClient();
export default redisClient; 