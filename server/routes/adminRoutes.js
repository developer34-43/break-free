/**
 * routes/adminRoutes.js
 */
const express = require('express');
const router = express.Router();
const { adminLogin, adminStats, adminMe } = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimit');

router.post('/login', loginLimiter, adminLogin); // public (rate limited)
router.get('/me', requireAdmin, adminMe); // admin only
router.get('/stats', requireAdmin, adminStats); // admin only

module.exports = router;