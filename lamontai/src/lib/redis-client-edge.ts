/**
 * Edge-compatible Redis client mock
 * This mock provides the same interface as the regular Redis client but works in Edge environments
 * without node.js dependencies.
 */

import { IRedisClient } from './redis-client';

interface CacheEntry<T> {
  value: T;
  expiry: number;
}

// In-memory cache for Edge runtime
const memoryCache: Record<string, CacheEntry<any>> = {};

/**
 * Edge-compatible Redis client class
 */
class EdgeRedisClient implements IRedisClient {
  /**
   * Always returns false for Edge environments
   */
  public isAlive(): boolean {
    return false;
  }

  /**
   * Store value in memory cache with expiration
   */
  public async set(key: string, value: any, ttl = 43200): Promise<void> {
    try {
      memoryCache[key] = {
        value,
        expiry: Date.now() + ttl * 1000,
      };
    } catch (error) {
      console.error(`Error setting cache key ${key}:`, error);
    }
  }

  /**
   * Get value from memory cache
   */
  public async get<T>(key: string): Promise<T | null> {
    try {
      if (memoryCache[key]) {
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
      return null;
    }
  }

  /**
   * Delete key from memory cache
   */
  public async delete(key: string): Promise<void> {
    try {
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
    ttl = 43200
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
   * Clear memory cache
   */
  public clearMemoryCache(): void {
    Object.keys(memoryCache).forEach((key) => {
      delete memoryCache[key];
    });
  }
}

// Export singleton instance
const edgeRedisClient = new EdgeRedisClient();
export default edgeRedisClient; 