/**
 * middleware/rateLimit.js
 * Basic rate limiting to slow down brute-force / spam attempts.
 */
const rateLimit = require('express-rate-limit');

// Public endpoints: 60 requests per 15 minutes per IP.
const publicLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.'
  }
});

// Admin login: 10 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.'
  }
});

module.exports = { publicLimiter, loginLimiter };