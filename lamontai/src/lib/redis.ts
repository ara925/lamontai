// Redis client setup with safety guards
let redisClient: any = null;

// Function to safely get Redis client
export function getRedisClient() {
  // If we're not in production, return a mock client
  if (process.env.NODE_ENV !== 'production') {
    return getMockRedisClient();
  }
  
  // Return existing client if available
  if (redisClient) {
    return redisClient;
  }
  
  try {
    // Only attempt to connect if REDIS_URL is defined
    if (process.env.REDIS_URL) {
      // Dynamically import to avoid issues when Redis is not available
      const { createClient } = require('redis');
      redisClient = createClient({
        url: process.env.REDIS_URL,
      });
      
      redisClient.on('error', (err: any) => {
        console.error('Redis client error:', err);
        redisClient = null;
      });
      
      // Connect to Redis
      redisClient.connect().catch((err: any) => {
        console.error('Redis connection error:', err);
        redisClient = null;
      });
      
      return redisClient;
    }
  } catch (error) {
    console.error('Failed to initialize Redis client:', error);
  }
  
  // Fallback to mock client
  return getMockRedisClient();
}

// Mock Redis client for development/testing
function getMockRedisClient() {
  const storage = new Map<string, string>();
  
  return {
    get: async (key: string) => storage.get(key) || null,
    set: async (key: string, value: string, options?: any) => {
      storage.set(key, value);
      return 'OK';
    },
    del: async (key: string) => {
      const existed = storage.has(key);
      storage.delete(key);
      return existed ? 1 : 0;
    },
    exists: async (key: string) => storage.has(key) ? 1 : 0,
    expire: async (key: string, seconds: number) => {
      if (!storage.has(key)) return 0;
      // In a real implementation, we'd set up a timer
      return 1;
    },
    isReady: true,
    on: (event: string, callback: Function) => {},
    connect: async () => {},
    quit: async () => {},
  };
} 