const express = require('express');
const router = express.Router();
const {
  getPlans, subscribe, webhook,
  adminGetPlans, createPlan, updatePlan, deletePlan
} = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Public
router.get('/', getPlans);

// Authenticated user
router.post('/subscribe', authenticate, subscribe);

// Webhook — raw body needed for signature verification
router.post('/webhook', express.raw({ type: 'application/json' }), webhook);

// Admin
router.get('/admin', authenticate, requireRole('admin'), adminGetPlans);
router.post('/plans', authenticate, requireRole('admin'), createPlan);
router.put('/plans/:id', authenticate, requireRole('admin'), updatePlan);
router.delete('/plans/:id', authenticate, requireRole('admin'), deletePlan);

module.exports = router;
