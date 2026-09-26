import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Helmet Security Headers Configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: false, // Often disabled in APIs if serving frontend separately
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Fixes CORS blocking for decoupled frontends
});

// 2. Auth Rate Limiter - Strict for brute force protection (5 requests per 15 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, 
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// 3. Global API Rate Limiter (100 requests per 15 minutes per IP)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, 
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/v1/cron') // Don't limit cron routes as they are external and protected by secret
});
