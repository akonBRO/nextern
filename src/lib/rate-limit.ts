// src/lib/rate-limit.ts
// Simple in-memory rate limiter for auth endpoints.
// For production at scale, replace with Upstash Redis rate limiting.
// This protects against brute-force on: /register, /login, /verify-email, /resend-otp

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 5 minutes to prevent memory leaks
setInterval(
  () => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (now > entry.resetAt) store.delete(key);
    });
  },
  5 * 60 * 1000
);

interface RateLimitOptions {
  maxRequests: number; // max allowed requests
  windowMs: number; // time window in milliseconds
}

/**
 * Returns { allowed: true } or { allowed: false, retryAfterSeconds: number }
 * Key should be a combination of IP + endpoint to scope limiting correctly.
 */
export function rateLimit(
  key: string,
  { maxRequests, windowMs }: RateLimitOptions
): { allowed: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfterSeconds = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfterSeconds };
  }

  entry.count += 1;
  return { allowed: true };
}

// Preset configs for different endpoints
export const rateLimits = {
  register: { maxRequests: 5, windowMs: 15 * 60 * 1000 }, // 5 per 15 min
  login: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 min
  verifyEmail: { maxRequests: 10, windowMs: 15 * 60 * 1000 }, // 10 per 15 min
  resendOTP: { maxRequests: 3, windowMs: 60 * 60 * 1000 }, // 3 per hour
};
