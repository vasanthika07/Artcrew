const express = require('express');
const router = express.Router();
const { getMediums, getMedium, createMedium, updateMedium, deleteMedium } = require('../controllers/mediumController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

router.get('/', getMediums);
router.get('/:id', getMedium);
router.post('/', authenticate, requireRole('admin'), createMedium);
router.put('/:id', authenticate, requireRole('admin'), updateMedium);
router.delete('/:id', authenticate, requireRole('admin'), deleteMedium);

module.exports = router;
