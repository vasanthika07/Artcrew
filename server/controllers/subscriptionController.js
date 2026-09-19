const SubscriptionPlan = require('../models/SubscriptionPlan');
const User = require('../models/User');
const PaymentService = require('../services/PaymentService');
const crypto = require('crypto');

// GET /api/subscriptions
const getPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find({ isActive: true })
      .populate('includedMediums', 'name slug')
      .sort({ order: 1, price: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// POST /api/subscriptions/subscribe
const subscribe = async (req, res, next) => {
  try {
    const { planId } = req.body;
    const user = req.user;

    const plan = await SubscriptionPlan.findById(planId);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    const checkout = await PaymentService.createSubscription({
      planId: plan.razorpayPlanId || plan._id.toString(),
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency || 'INR',
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
    });

    res.json({ success: true, data: checkout, checkout });
  } catch (error) {
    next(error);
  }
};

// POST /api/subscriptions/verify-payment (Server-side HMAC verification before activation)
const verifyPayment = async (req, res, next) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
      planId,
    } = req.body;

    if (!planId) {
      return res.status(422).json({ success: false, message: 'planId is required' });
    }

    const result = await PaymentService.verifyPaymentSignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpay_subscription_id,
      planId,
      userId: req.user._id,
    });

    res.json({
      success: true,
      message: 'Subscription successfully activated!',
      data: result,
    });
  } catch (error) {
    console.error('[subscriptionController] Payment verification error:', error.message);
    res.status(400).json({
      success: false,
      message: error.message || 'Payment verification failed',
    });
  }
};

// POST /api/subscriptions/webhook
const webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (secret && signature) {
      const rawBody = req.rawBody || (typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(rawBody)
        .digest('hex');

      if (signature !== expectedSignature) {
        return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
      }
    }

    let event = req.body;
    if (!event && req.rawBody) {
      try {
        event = JSON.parse(req.rawBody);
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
      }
    } else if (typeof event === 'string') {
      try {
        event = JSON.parse(event);
      } catch (parseErr) {
        return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
      }
    }

    if (!event) {
      return res.status(400).json({ success: false, message: 'Empty webhook payload' });
    }

    await PaymentService.handleWebhook(event);

    res.json({ success: true, received: true });
  } catch (error) {
    console.error('[subscriptionController] Webhook handling error:', error);
    next(error);
  }
};

// GET /api/subscriptions/plans (admin)
const adminGetPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find()
      .populate('includedMediums', 'name slug')
      .sort({ order: 1 });
    res.json({ success: true, data: plans });
  } catch (error) {
    next(error);
  }
};

// POST /api/subscriptions/plans (admin)
const createPlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.create(req.body);
    res.status(201).json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// PUT /api/subscriptions/plans/:id (admin)
const updatePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, data: plan });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/subscriptions/plans/:id (admin)
const deletePlan = async (req, res, next) => {
  try {
    const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    res.json({ success: true, message: 'Plan deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlans,
  subscribe,
  verifyPayment,
  webhook,
  adminGetPlans,
  createPlan,
  updatePlan,
  deletePlan,
};
