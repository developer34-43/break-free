/**
 * utils/token.js
 * Minimal stateless session token for the admin dashboard.
 * A HMAC-SHA256 signature is created with SESSION_SECRET, so tokens
 * can be verified without storing sessions in the database.
 */
const crypto = require('crypto');

const secret = () => process.env.SESSION_SECRET || 'breakfree-dev-secret';

function signToken(payload) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret())
    .update(body)
    .digest('base64url');
  return `${body}.${signature}`;
}

function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const expected = crypto
    .createHmac('sha256', secret())
    .update(parts[0])
    .digest('base64url');
  // Constant-time comparison to avoid timing attacks.
  const a = Buffer.from(expected);
  const b = Buffer.from(parts[1]);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString());
    if (!payload.adminId || !payload.exp || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

function createToken(admin) {
  const payload = {
    adminId: admin._id.toString(),
    username: admin.username,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  return signToken(payload);
}

module.exports = { createToken, verifyToken };