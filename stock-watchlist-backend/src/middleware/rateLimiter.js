import { AppError } from './errorHandler.js';

// Simple in-memory rate limiter
class RateLimiter {
  constructor(windowMs = 15 * 60 * 1000, maxRequests = 100) { // 15 minutes, 100 requests
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.requests = new Map();
    
    // Clean up old entries every 5 minutes
    setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now - data.resetTime > this.windowMs) {
        this.requests.delete(key);
      }
    }
  }

  isAllowed(identifier) {
    const now = Date.now();
    const data = this.requests.get(identifier);

    if (!data) {
      // First request from this identifier
      this.requests.set(identifier, {
        count: 1,
        resetTime: now,
        firstRequest: now
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // Check if window has expired
    if (now - data.firstRequest > this.windowMs) {
      // Reset the window
      this.requests.set(identifier, {
        count: 1,
        resetTime: now,
        firstRequest: now
      });
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    // Check if limit exceeded
    if (data.count >= this.maxRequests) {
      const retryAfter = Math.ceil((this.windowMs - (now - data.firstRequest)) / 1000);
      return { 
        allowed: false, 
        remaining: 0, 
        retryAfter,
        resetTime: data.firstRequest + this.windowMs
      };
    }

    // Increment counter
    data.count++;
    this.requests.set(identifier, data);

    return { 
      allowed: true, 
      remaining: this.maxRequests - data.count 
    };
  }
}

// Create rate limiter instances
const generalLimiter = new RateLimiter(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const strictLimiter = new RateLimiter(60 * 1000, 10); // 10 requests per minute for write operations

// General rate limiting middleware
export const rateLimiter = (req, res, next) => {
  // Get client identifier (IP address with fallbacks)
  const identifier = req.ip || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    req.headers['x-forwarded-for']?.split(',')[0] ||
                    'unknown';

  const result = generalLimiter.isAllowed(identifier);

  // Set rate limit headers
  res.set({
    'X-RateLimit-Limit': generalLimiter.maxRequests,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Window': Math.ceil(generalLimiter.windowMs / 1000)
  });

  if (!result.allowed) {
    res.set('Retry-After', result.retryAfter);
    return next(new AppError('Too many requests. Please try again later.', 429));
  }

  next();
};

// Strict rate limiting for write operations
export const strictRateLimiter = (req, res, next) => {
  // Only apply to write operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const identifier = req.ip || 
                    req.connection?.remoteAddress || 
                    req.socket?.remoteAddress || 
                    req.headers['x-forwarded-for']?.split(',')[0] ||
                    'unknown';

  const result = strictLimiter.isAllowed(identifier);

  // Set rate limit headers
  res.set({
    'X-RateLimit-Strict-Limit': strictLimiter.maxRequests,
    'X-RateLimit-Strict-Remaining': result.remaining,
    'X-RateLimit-Strict-Window': Math.ceil(strictLimiter.windowMs / 1000)
  });

  if (!result.allowed) {
    res.set('Retry-After', result.retryAfter);
    return next(new AppError('Too many write requests. Please slow down.', 429));
  }

  next();
};

// Custom rate limiter for specific endpoints
export const createRateLimiter = (windowMs, maxRequests, message) => {
  const limiter = new RateLimiter(windowMs, maxRequests);
  
  return (req, res, next) => {
    const identifier = req.ip || 
                      req.connection?.remoteAddress || 
                      req.socket?.remoteAddress || 
                      req.headers['x-forwarded-for']?.split(',')[0] ||
                      'unknown';

    const result = limiter.isAllowed(identifier);

    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': result.remaining,
      'X-RateLimit-Window': Math.ceil(windowMs / 1000)
    });

    if (!result.allowed) {
      res.set('Retry-After', result.retryAfter);
      return next(new AppError(message || 'Rate limit exceeded', 429));
    }

    next();
  };
};