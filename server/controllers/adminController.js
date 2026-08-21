/**
 * controllers/adminController.js
 * Admin login + dashboard statistics.
 */
const Admin = require('../models/Admin');
const NGO = require('../models/NGO');
const SupportRequest = require('../models/SupportRequest');
const { createToken } = require('../utils/token');

/**
 * POST /api/admin/login
 * Verifies username + password against the bcrypt hash.
 */
async function adminLogin(req, res, next) {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please enter both username and password.'
      });
    }

    const admin = await Admin.findOne({ username: String(username).trim().toLowerCase() });
    if (!admin || !admin.verifyPassword(String(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password.'
      });
    }

    const token = createToken(admin);
    res.json({
      success: true,
      message: 'Login successful.',
      token,
      admin: { username: admin.username }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/stats  (admin only)
 * Dashboard numbers: enquiries, NGOs, verified NGOs, recent enquiries.
 */
async function adminStats(req, res, next) {
  try {
    const [totalRequests, totalNGOs, verifiedNGOs, recentRequests] = await Promise.all([
      SupportRequest.countDocuments(),
      NGO.countDocuments(),
      NGO.countDocuments({ verified: true }),
      SupportRequest.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('name phone addictionCategories preferredArea createdAt')
    ]);

    res.json({
      success: true,
      stats: {
        totalRequests,
        totalNGOs,
        verifiedNGOs,
        recentRequests
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/admin/me  (admin only)
 * Sanity check to validate an existing token on page load.
 */
async function adminMe(req, res) {
  res.json({ success: true, admin: { id: req.admin.id, username: req.admin.username } });
}

module.exports = { adminLogin, adminStats, adminMe };