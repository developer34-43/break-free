/**
 * routes/ngoRoutes.js
 */
const express = require('express');
const router = express.Router();
const {
  listNGOs,
  getNGO,
  createNGO,
  updateNGO,
  deleteNGO,
  toggleVerifyNGO
} = require('../controllers/ngoController');
const { requireAdmin } = require('../middleware/auth');

router.get('/', listNGOs); // public - used for browsing and matching
router.get('/:id', getNGO); // public - detail view
router.post('/', requireAdmin, createNGO); // admin only
router.put('/:id', requireAdmin, updateNGO); // admin only
router.patch('/:id/verify', requireAdmin, toggleVerifyNGO); // admin only
router.delete('/:id', requireAdmin, deleteNGO); // admin only

module.exports = router;