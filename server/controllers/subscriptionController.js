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
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    const checkout = await PaymentService.createSubscription({
      planId: plan.razorpayPlanId || planId,
      planName: plan.name,
      amount: plan.price,
      currency: plan.currency,
      userId: user._id.toString(),
      userEmail: user.email,
      userName: user.name,
    });

    res.json({ success: true, checkout });
  } catch (error) {
    next(error);
  }
};

// POST /api/subscriptions/webhook
const webhook = async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.rawBody;

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body;
    await PaymentService.handleWebhook(event);

    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

// GET /api/subscriptions/plans (admin)
const adminGetPlans = async (req, res, next) => {
  try {
    const plans = await SubscriptionPlan.find().populate('includedMediums', 'name slug').sort({ order: 1 });
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

module.exports = { getPlans, subscribe, webhook, adminGetPlans, createPlan, updatePlan, deletePlan };
