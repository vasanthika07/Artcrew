const express = require('express');
const router = express.Router();
const {
  getLiveSessions,
  getLiveSession,
  joinLiveSession,
  createLiveSession,
  updateLiveSession,
  deleteLiveSession,
} = require('../controllers/liveSessionController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Public listing & single view (both sanitized)
router.get('/', getLiveSessions);
router.get('/:id', getLiveSession);

// Join stream (Subscription & tier verified server-side inside controller)
router.get('/:id/join', authenticate, joinLiveSession);

// Admin operations
router.post('/', authenticate, requireRole('admin'), createLiveSession);
router.put('/:id', authenticate, requireRole('admin'), updateLiveSession);
router.delete('/:id', authenticate, requireRole('admin'), deleteLiveSession);

module.exports = router;
