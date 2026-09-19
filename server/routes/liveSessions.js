const express = require('express');
const router = express.Router();
const {
  getLiveSessions, getLiveSession, joinLiveSession,
  createLiveSession, updateLiveSession, deleteLiveSession
} = require('../controllers/liveSessionController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole, requireSubscription } = require('../middleware/authorize');

router.get('/', getLiveSessions);
router.get('/:id', getLiveSession);
router.get('/:id/join', authenticate, requireSubscription('basic'), joinLiveSession);
router.post('/', authenticate, requireRole('admin'), createLiveSession);
router.put('/:id', authenticate, requireRole('admin'), updateLiveSession);
router.delete('/:id', authenticate, requireRole('admin'), deleteLiveSession);

module.exports = router;
