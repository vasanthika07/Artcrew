const express = require('express');
const router = express.Router();
const {
  getMediums,
  getMedium,
  createMedium,
  updateMedium,
  deleteMedium,
  getMediumResources,
  createMediumResource,
  deleteMediumResource,
} = require('../controllers/mediumController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Public
router.get('/', getMediums);
router.get('/:id', getMedium);
router.get('/:id/resources', getMediumResources);

// Admin
router.post('/', authenticate, requireRole('admin'), createMedium);
router.put('/:id', authenticate, requireRole('admin'), updateMedium);
router.delete('/:id', authenticate, requireRole('admin'), deleteMedium);

// Nested Resource Management
router.post('/:id/resources', authenticate, requireRole('admin'), createMediumResource);
router.delete('/:id/resources/:resourceId', authenticate, requireRole('admin'), deleteMediumResource);

module.exports = router;
