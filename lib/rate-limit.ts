/**
 * Rate Limiting Module
 *
 * IP-based rate limiting with in-memory storage.
 * For production scale, upgrade to Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store for rate limiting (per-instance, not distributed)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Maximum requests per window
}

// Default rate limits per endpoint
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/chat': { windowMs: 60 * 1000, maxRequests: 30 },           // 30/min
  '/api/documents/upload-url': { windowMs: 60 * 1000, maxRequests: 5 }, // 5/min
  '/api/documents/upload': { windowMs: 60 * 1000, maxRequests: 5 },     // 5/min
  '/api/documents/process': { windowMs: 60 * 1000, maxRequests: 10 },   // 10/min
  '/api/leads': { windowMs: 60 * 1000, maxRequests: 10 },               // 10/min
  'default': { windowMs: 60 * 1000, maxRequests: 60 },                  // 60/min default
};

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  retryAfter?: number;
}

/**
 * Check if a request should be rate limited
 *
 * @param ip - Client IP address
 * @param endpoint - API endpoint path
 * @returns RateLimitResult with success status and headers
 */
export function checkRateLimit(ip: string, endpoint: string): RateLimitResult {
  const config = RATE_LIMITS[endpoint] || RATE_LIMITS['default'];
  const key = `${ip}:${endpoint}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Initialize or reset if window expired
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + config.windowMs,
    };
  }

  // Check if over limit
  if (entry.count >= config.maxRequests) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return {
      success: false,
      limit: config.maxRequests,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter,
    };
  }

  // Increment counter
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    success: true,
    limit: config.maxRequests,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Get rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.floor(result.resetTime / 1000)),
  };

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return headers;
}

/**
 * Extract client IP from request headers
 * Handles proxied requests (Vercel, Cloudflare, etc.)
 */
export function getClientIp(request: Request): string {
  // Check common proxy headers
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take first IP (original client)
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // Fallback - shouldn't happen in production
  return '127.0.0.1';
}
