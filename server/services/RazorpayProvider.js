const Razorpay = require('razorpay');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');

let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay credentials not configured');
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay subscription
 */
const createSubscription = async ({ planId, planName, amount, currency, userId, userEmail, userName }) => {
  const rzp = getRazorpay();

  // If a real Razorpay plan ID is provided, use subscription API
  if (planId && planId.startsWith('plan_')) {
    const subscription = await rzp.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      quantity: 1,
      total_count: 12, // 12 billing cycles
      notes: { userId, userEmail, userName },
    });

    return {
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
      key: process.env.RAZORPAY_KEY_ID,
      amount,
      currency,
      planName,
    };
  }

  // Fallback: Create a one-time order for demo purposes
  const order = await rzp.orders.create({
    amount: amount * 100, // Razorpay expects paise
    currency: currency || 'INR',
    notes: { userId, userEmail, userName, planId, planName },
  });

  return {
    orderId: order.id,
    key: process.env.RAZORPAY_KEY_ID,
    amount,
    currency,
    planName,
    userName,
    userEmail,
  };
};

/**
 * Handle Razorpay webhook events
 */
const handleWebhook = async (event) => {
  const { event: eventType, payload } = event;

  if (eventType === 'subscription.activated' || eventType === 'payment.captured') {
    const notes = payload?.payment?.entity?.notes || payload?.subscription?.entity?.notes || {};
    const { userId, planId } = notes;

    if (!userId) return;

    const plan = await SubscriptionPlan.findById(planId);
    const tierMap = { basic: 'basic', pro: 'pro', 'studio-access': 'studio' };
    const tier = plan ? (tierMap[plan.slug] || 'basic') : 'basic';

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan?.billingPeriod === 'yearly' ? 12 : 1));

    await User.findByIdAndUpdate(userId, {
      subscriptionId: plan?._id,
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
      razorpaySubscriptionId: payload?.subscription?.entity?.id || '',
      $push: {
        billingHistory: {
          amount: (payload?.payment?.entity?.amount || 0) / 100,
          currency: payload?.payment?.entity?.currency || 'INR',
          status: 'paid',
          paymentId: payload?.payment?.entity?.id || '',
          plan: plan?.name || 'Unknown',
        },
      },
    });
  }

  if (eventType === 'subscription.cancelled' || eventType === 'subscription.expired') {
    const notes = payload?.subscription?.entity?.notes || {};
    const { userId } = notes;
    if (userId) {
      await User.findByIdAndUpdate(userId, { subscriptionStatus: 'cancelled', subscriptionTier: null });
    }
  }
};

/**
 * Cancel a Razorpay subscription
 */
const cancelSubscription = async (subscriptionId) => {
  const rzp = getRazorpay();
  return rzp.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
};

module.exports = { createSubscription, handleWebhook, cancelSubscription };
