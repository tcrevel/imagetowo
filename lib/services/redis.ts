/**
 * Redis Client
 * 
 * Provides a singleton Redis connection for rate limiting.
 * Falls back gracefully if Redis is not configured.
 */

import Redis from "ioredis";

// ============================================================================
// Types
// ============================================================================

export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, mode?: "EX", duration?: number): Promise<"OK" | null>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  quit(): Promise<"OK">;
}

// ============================================================================
// Client Singleton
// ============================================================================

let redisClient: Redis | null = null;
let connectionFailed = false;

/**
 * Get or create Redis client
 * Returns null if Redis is not configured or connection failed
 */
export function getRedisClient(): Redis | null {
  // If connection already failed, don't retry
  if (connectionFailed) {
    return null;
  }
  
  // Return existing client
  if (redisClient) {
    return redisClient;
  }
  
  // Check if Redis URL is configured
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    console.log("ℹ️ REDIS_URL not configured, using in-memory rate limiting");
    return null;
  }
  
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          console.error("❌ Redis connection failed after 3 retries");
          connectionFailed = true;
          return null; // Stop retrying
        }
        return Math.min(times * 100, 2000); // Exponential backoff
      },
      lazyConnect: true,
    });
    
    // Handle connection events
    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });
    
    redisClient.on("error", (err) => {
      console.error("❌ Redis error:", err.message);
      connectionFailed = true;
    });
    
    redisClient.on("close", () => {
      console.log("ℹ️ Redis connection closed");
    });
    
    return redisClient;
  } catch (error) {
    console.error("❌ Failed to create Redis client:", error);
    connectionFailed = true;
    return null;
  }
}

/**
 * Check if Redis is available and connected
 */
export async function isRedisAvailable(): Promise<boolean> {
  const client = getRedisClient();
  if (!client) return false;
  
  try {
    await client.ping();
    return true;
  } catch {
    return false;
  }
}

/**
 * Gracefully close Redis connection
 */
export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
