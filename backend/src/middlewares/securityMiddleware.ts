import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// 1. Helmet Security Headers Configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: false, // Often disabled in APIs if serving frontend separately
  crossOriginEmbedderPolicy: false,
});

// 2. Auth Rate Limiter - Strict for brute force protection (5 requests per 15 minutes)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5, 
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true, 
  legacyHeaders: false,
});

// 3. Global API Rate Limiter (100 requests per 15 minutes per IP)
export const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100, 
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/v1/cron') // Don't limit cron routes as they are external and protected by secret
});
