const express = require('express');
const router  = express.Router();
const {
  getNearbyStudios,
  getStudios,
  createStudio,
  updateStudio,
  deleteStudio,
} = require('../controllers/studioController');
const { authenticate }  = require('../middleware/authenticate');
const { requireRole }   = require('../middleware/authorize');

// Public
router.get('/',       getStudios);
router.get('/nearby', getNearbyStudios);

// Admin-only
router.post('/',    authenticate, requireRole('admin'), createStudio);
router.put('/:id',  authenticate, requireRole('admin'), updateStudio);
router.delete('/:id', authenticate, requireRole('admin'), deleteStudio);

module.exports = router;
