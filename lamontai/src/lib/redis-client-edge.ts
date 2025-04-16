/**
 * Edge-compatible Redis client wrapper
 * This file provides a stubbed Redis client for Edge environments
 * that is API-compatible with the full Redis client but operates
 * differently in Edge environments.
 */

import { kv } from '@vercel/kv';

// Simple in-memory fallback when kv is not available
const memoryCache: Record<string, { value: any; expiry: number }> = {};

// Default TTL
const DEFAULT_CACHE_TTL = 12 * 60 * 60; // 12 hours in seconds

class EdgeRedisClient {
  private static instance: EdgeRedisClient | null = null;
  private redisClient: any = null;
  private isEdgeEnvironment: boolean;

  private constructor() {
    // Check if we're in an edge environment
    this.isEdgeEnvironment = typeof process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED !== 'undefined' &&
      process.env.NEXT_PUBLIC_CLOUDFLARE_ENABLED === 'true';
    
    // Initialize the KV client if we're in an edge environment
    if (this.isEdgeEnvironment && typeof kv !== 'undefined') {
      this.redisClient = kv;
    } else {
      // In non-edge environments, this client will not be used
      // The regular redis-client.ts will be imported instead
      console.warn('EdgeRedisClient initialized in a non-edge environment.');
    }
  }

  public static getInstance(): EdgeRedisClient {
    if (!EdgeRedisClient.instance) {
      EdgeRedisClient.instance = new EdgeRedisClient();
    }
    return EdgeRedisClient.instance;
  }

  /**
   * Check if the client is alive and connected
   */
  isAlive(): boolean {
    return this.redisClient !== null;
  }

  /**
   * Get a value from Redis
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.redisClient) {
      // Use memory fallback when KV is not available
      if (memoryCache[key] && memoryCache[key].expiry > Date.now()) {
        return memoryCache[key].value as T;
      }
      return null;
    }
    
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      console.error('EdgeRedisClient get error:', error);
      // Try memory cache as fallback
      if (memoryCache[key] && memoryCache[key].expiry > Date.now()) {
        return memoryCache[key].value as T;
      }
      return null;
    }
  }

  /**
   * Set a value in Redis
   */
  async set<T>(key: string, value: T, ttl = DEFAULT_CACHE_TTL): Promise<void> {
    // Also store in memory cache for fallback
    memoryCache[key] = { 
      value, 
      expiry: Date.now() + (ttl * 1000)
    };
    
    if (!this.redisClient) return;
    
    try {
      if (ttl) {
        await this.redisClient.set(key, value, { ex: ttl });
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      console.error('EdgeRedisClient set error:', error);
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<number> {
    // Also remove from memory cache
    delete memoryCache[key];
    
    if (!this.redisClient) return 0;
    
    try {
      return await this.redisClient.del(key);
    } catch (error) {
      console.error('EdgeRedisClient del error:', error);
      return 0;
    }
  }
  
  /**
   * Delete a key from Redis (alias for del)
   */
  async delete(key: string): Promise<void> {
    await this.del(key);
  }

  /**
   * Check if a key exists in Redis
   */
  async exists(key: string): Promise<number> {
    // Check memory cache first
    if (memoryCache[key] && memoryCache[key].expiry > Date.now()) {
      return 1;
    }
    
    if (!this.redisClient) return 0;
    
    try {
      return await this.redisClient.exists(key);
    } catch (error) {
      console.error('EdgeRedisClient exists error:', error);
      return 0;
    }
  }

  /**
   * Set expiry time on a key
   */
  async expire(key: string, seconds: number): Promise<number> {
    // Update memory cache expiry
    if (memoryCache[key]) {
      memoryCache[key].expiry = Date.now() + (seconds * 1000);
    }
    
    if (!this.redisClient) return 0;
    
    try {
      return await this.redisClient.expire(key, seconds);
    } catch (error) {
      console.error('EdgeRedisClient expire error:', error);
      return 0;
    }
  }

  /**
   * Get all keys matching a pattern
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.redisClient) {
      // Simple pattern matching for memory cache
      return Object.keys(memoryCache).filter(key => 
        key.includes(pattern.replace('*', ''))
      );
    }
    
    try {
      return await this.redisClient.keys(pattern);
    } catch (error) {
      console.error('EdgeRedisClient keys error:', error);
      return [];
    }
  }

  /**
   * Get or set a value with a fetcher function
   */
  async getOrSet<T>(
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
      
      // Store in cache (only if value is not null/undefined)
      if (freshValue !== null && freshValue !== undefined) {
        await this.set(key, freshValue, ttl);
      }
      
      return freshValue;
    } catch (error) {
      console.error(`Error fetching data for cache key ${key}:`, error);
      throw error; // Re-throw to let caller handle it
    }
  }

  /**
   * Clear memory cache
   */
  clearMemoryCache(): void {
    Object.keys(memoryCache).forEach((key) => {
      delete memoryCache[key];
    });
  }

  /**
   * Close the Redis connection
   */
  async quit(): Promise<'OK'> {
    if (!this.redisClient) return 'OK';
    
    try {
      // Do nothing in Edge runtime
      return 'OK';
    } catch (error) {
      console.error('EdgeRedisClient quit error:', error);
      return 'OK';
    }
  }
}

// Export a singleton instance
const edgeRedisClient = EdgeRedisClient.getInstance();
export default edgeRedisClient; 