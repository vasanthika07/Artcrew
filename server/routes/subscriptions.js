const express = require('express');
const router = express.Router();
const {
  getPlans,
  subscribe,
  verifyPayment,
  webhook,
  adminGetPlans,
  createPlan,
  updatePlan,
  deletePlan,
} = require('../controllers/subscriptionController');
const { authenticate } = require('../middleware/authenticate');
const { requireRole } = require('../middleware/authorize');

// Public
router.get('/', getPlans);
router.get('/plans', getPlans);

// Authenticated user checkout & server-side payment verification
router.post('/subscribe', authenticate, subscribe);
router.post('/checkout', authenticate, subscribe);
router.post('/verify-payment', authenticate, verifyPayment);

// Webhook — accepts JSON body
router.post('/webhook', webhook);

// Admin
router.get('/admin', authenticate, requireRole('admin'), adminGetPlans);
router.post('/plans', authenticate, requireRole('admin'), createPlan);
router.put('/plans/:id', authenticate, requireRole('admin'), updatePlan);
router.delete('/plans/:id', authenticate, requireRole('admin'), deletePlan);

module.exports = router;
