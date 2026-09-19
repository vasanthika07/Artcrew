const express = require('express');
const router = express.Router();
const {
  getRecordings,
  playRecording,
  updateProgress,
  getProgress,
  getContinueWatching,
  createRecording,
  updateRecording,
  deleteRecording,
} = require('../controllers/recordingController');
const { authenticate, optionalAuth } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Public listing (optional auth to attach progress)
router.get('/', optionalAuth, getRecordings);

// Continue watching queue (must be defined BEFORE :id params)
router.get('/continue-watching', authenticate, getContinueWatching);

// Play/watch recording (subscription authorization verified inside controller)
router.get('/:id/play', authenticate, playRecording);
router.get('/:id/watch', authenticate, playRecording);

// Watch progress tracking endpoints
router.post('/:id/progress', authenticate, updateProgress);
router.get('/:id/progress', authenticate, getProgress);

// Admin endpoints
router.post('/', authenticate, requireRole('admin'), createRecording);
router.put('/:id', authenticate, requireRole('admin'), updateRecording);
router.delete('/:id', authenticate, requireRole('admin'), deleteRecording);

module.exports = router;
