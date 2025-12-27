/**
 * Rate Limiting Service
 * 
 * Limits API usage per user using IP + fingerprint combination.
 * Configurable via environment variables.
 * 
 * Supports two storage backends:
 * - Redis (recommended for production/multi-instance)
 * - In-memory (fallback for development/single-instance)
 */

import { getServerEnv } from "@/lib/utils/env";
import { getRedisClient } from "./redis";

// ============================================================================
// Types
// ============================================================================

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  resetAt: Date;
  storage: "redis" | "memory";
}

interface UsageRecord {
  count: number;
  resetAt: number; // timestamp
}

// ============================================================================
// Constants
// ============================================================================

const RATE_LIMIT_PREFIX = "ratelimit:";

// ============================================================================
// In-Memory Storage (Fallback)
// ============================================================================

const usageStore = new Map<string, UsageRecord>();

// Cleanup old entries every hour
const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of usageStore.entries()) {
      if (record.resetAt < now) {
        usageStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
  
  // Don't prevent process from exiting
  cleanupTimer.unref();
}

// Start cleanup on module load
startCleanup();

// ============================================================================
// Core Functions
// ============================================================================

/**
 * Generate a unique identifier from IP and fingerprint
 */
export function generateUserId(ip: string, fingerprint?: string): string {
  // Combine IP and fingerprint for better identification
  const combined = fingerprint ? `${ip}:${fingerprint}` : ip;
  
  // Simple hash for privacy (don't store raw IPs)
  return hashString(combined);
}

/**
 * Simple string hash (not cryptographic, just for key generation)
 */
function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get the end of the current day (UTC)
 */
function getDayEnd(): number {
  const now = new Date();
  const dayStart = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate()
  )).getTime();
  return dayStart + 24 * 60 * 60 * 1000;
}

/**
 * Get seconds until end of day (for Redis TTL)
 */
function getSecondsUntilDayEnd(): number {
  const dayEnd = getDayEnd();
  return Math.ceil((dayEnd - Date.now()) / 1000);
}

// ============================================================================
// Redis Operations
// ============================================================================

/**
 * Check rate limit using Redis
 */
async function checkRateLimitRedis(userId: string): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const env = getServerEnv();
    const limit = env.DAILY_PARSE_LIMIT;
    const key = `${RATE_LIMIT_PREFIX}${userId}`;
    
    const countStr = await redis.get(key);
    const count = countStr ? parseInt(countStr, 10) : 0;
    const ttl = await redis.ttl(key);
    
    // Calculate reset time
    const resetAt = ttl > 0 
      ? new Date(Date.now() + ttl * 1000)
      : new Date(getDayEnd());
    
    const remaining = Math.max(0, limit - count);
    
    return {
      allowed: remaining > 0,
      remaining,
      limit,
      resetAt,
      storage: "redis",
    };
  } catch (error) {
    console.error("Redis checkRateLimit error:", error);
    return null;
  }
}

/**
 * Consume rate limit using Redis
 */
async function consumeRateLimitRedis(userId: string): Promise<RateLimitResult | null> {
  const redis = getRedisClient();
  if (!redis) return null;
  
  try {
    const env = getServerEnv();
    const limit = env.DAILY_PARSE_LIMIT;
    const key = `${RATE_LIMIT_PREFIX}${userId}`;
    const ttl = getSecondsUntilDayEnd();
    
    // Increment and set expiry atomically
    const count = await redis.incr(key);
    
    // Set expiry only on first request of the day
    if (count === 1) {
      await redis.expire(key, ttl);
    }
    
    // Get actual TTL for reset time
    const actualTtl = await redis.ttl(key);
    const resetAt = actualTtl > 0 
      ? new Date(Date.now() + actualTtl * 1000)
      : new Date(getDayEnd());
    
    const remaining = Math.max(0, limit - count);
    
    return {
      allowed: count <= limit,
      remaining,
      limit,
      resetAt,
      storage: "redis",
    };
  } catch (error) {
    console.error("Redis consumeRateLimit error:", error);
    return null;
  }
}

// ============================================================================
// In-Memory Operations
// ============================================================================

/**
 * Check rate limit using in-memory storage
 */
function checkRateLimitMemory(userId: string): RateLimitResult {
  const env = getServerEnv();
  const limit = env.DAILY_PARSE_LIMIT;
  const now = Date.now();
  const dayEnd = getDayEnd();
  
  const record = usageStore.get(userId);
  
  // No record or expired record
  if (!record || record.resetAt < now) {
    return {
      allowed: true,
      remaining: limit,
      limit,
      resetAt: new Date(dayEnd),
      storage: "memory",
    };
  }
  
  const remaining = Math.max(0, limit - record.count);
  
  return {
    allowed: remaining > 0,
    remaining,
    limit,
    resetAt: new Date(record.resetAt),
    storage: "memory",
  };
}

/**
 * Consume rate limit using in-memory storage
 */
function consumeRateLimitMemory(userId: string): RateLimitResult {
  const env = getServerEnv();
  const limit = env.DAILY_PARSE_LIMIT;
  const now = Date.now();
  const dayEnd = getDayEnd();
  
  let record = usageStore.get(userId);
  
  // Create or reset expired record
  if (!record || record.resetAt < now) {
    record = {
      count: 0,
      resetAt: dayEnd,
    };
  }
  
  // Increment usage
  record.count += 1;
  usageStore.set(userId, record);
  
  const remaining = Math.max(0, limit - record.count);
  
  return {
    allowed: record.count <= limit,
    remaining,
    limit,
    resetAt: new Date(record.resetAt),
    storage: "memory",
  };
}

// ============================================================================
// Public API (with Redis fallback to Memory)
// ============================================================================

/**
 * Check rate limit for a user
 * Uses Redis if available, falls back to in-memory
 */
export async function checkRateLimitAsync(userId: string): Promise<RateLimitResult> {
  const redisResult = await checkRateLimitRedis(userId);
  if (redisResult) return redisResult;
  
  return checkRateLimitMemory(userId);
}

/**
 * Consume one unit from the rate limit
 * Uses Redis if available, falls back to in-memory
 */
export async function consumeRateLimitAsync(userId: string): Promise<RateLimitResult> {
  const redisResult = await consumeRateLimitRedis(userId);
  if (redisResult) return redisResult;
  
  return consumeRateLimitMemory(userId);
}

/**
 * Synchronous check - uses memory only (for backward compatibility)
 */
export function checkRateLimit(userId: string): RateLimitResult {
  return checkRateLimitMemory(userId);
}

/**
 * Synchronous consume - uses memory only (for backward compatibility)
 */
export function consumeRateLimit(userId: string): RateLimitResult {
  return consumeRateLimitMemory(userId);
}

/**
 * Get usage stats (memory storage only)
 */
export function getUsageStats(): { activeUsers: number; totalRequests: number } {
  let totalRequests = 0;
  const now = Date.now();
  let activeUsers = 0;
  
  for (const record of usageStore.values()) {
    if (record.resetAt >= now) {
      activeUsers++;
      totalRequests += record.count;
    }
  }
  
  return { activeUsers, totalRequests };
}

// ============================================================================
// Request Helpers
// ============================================================================

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers (in order of reliability)
  const headers = request.headers;
  
  // Vercel/Cloudflare
  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp) return cfConnectingIp;
  
  // X-Forwarded-For (may contain multiple IPs)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    const ips = xForwardedFor.split(",").map(ip => ip.trim());
    return ips[0]; // First IP is the client
  }
  
  // X-Real-IP
  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) return xRealIp;
  
  // Fallback
  return "unknown";
}

/**
 * Extract fingerprint from request headers (set by client)
 */
export function getFingerprint(request: Request): string | undefined {
  return request.headers.get("x-client-fingerprint") || undefined;
}
