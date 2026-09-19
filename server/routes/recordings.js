const express = require('express');
const router = express.Router();
const {
  getRecordings, playRecording, createRecording, updateRecording, deleteRecording
} = require('../controllers/recordingController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole, requireSubscription } = require('../middleware/authorize');

router.get('/', getRecordings);
router.get('/:id/play', authenticate, requireSubscription('basic'), playRecording);
router.post('/', authenticate, requireRole('admin'), createRecording);
router.put('/:id', authenticate, requireRole('admin'), updateRecording);
router.delete('/:id', authenticate, requireRole('admin'), deleteRecording);

module.exports = router;
