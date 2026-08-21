/**
 * routes/supportRoutes.js
 */
const express = require('express');
const router = express.Router();
const {
  createSupportRequest,
  listSupportRequests,
  getSupportRequest
} = require('../controllers/supportController');
const { requireAdmin } = require('../middleware/auth');

router.post('/', createSupportRequest); // public - the enquiry form
router.get('/', requireAdmin, listSupportRequests); // admin only
router.get('/:id', requireAdmin, getSupportRequest); // admin only

module.exports = router;