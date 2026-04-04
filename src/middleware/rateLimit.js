const rateLimit = require('express-rate-limit');

const windowMs = 15 * 60 * 1000;

/**
 * Stricter limit for auth routes (login, signup, password reset, etc.)
 */
const authLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

/**
 * General API limiter for all /api routes (webhooks registered earlier are unaffected).
 * Skips /api-docs so interactive docs are not counted against API quotas.
 */
const apiLimiter = rateLimit({
  windowMs,
  max: Number(process.env.RATE_LIMIT_API_MAX) || 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    return path.startsWith('/api-docs');
  },
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
});

module.exports = { authLimiter, apiLimiter };
