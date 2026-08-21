/**
 * middleware/auth.js
 * Protects admin-only routes. Reads the Bearer token from the
 * Authorization header and verifies its HMAC signature.
 */
const { verifyToken } = require('../utils/token');

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized. Please login as admin.'
    });
  }

  req.admin = { id: payload.adminId, username: payload.username };
  next();
}

module.exports = { requireAdmin };