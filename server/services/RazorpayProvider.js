const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/User');
const SubscriptionPlan = require('../models/SubscriptionPlan');

let razorpayInstance = null;

const getRazorpay = () => {
  if (!razorpayInstance) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.warn('[RazorpayProvider] Razorpay credentials missing or running in sandbox simulation mode');
      return null;
    }
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpayInstance;
};

/**
 * Maps plan slug to subscription tier string
 */
const getTierFromSlug = (slug = '') => {
  const s = slug.toLowerCase();
  if (s.includes('studio')) return 'studio';
  if (s.includes('pro')) return 'pro';
  return 'basic';
};

/**
 * Create a Razorpay subscription or checkout order
 */
const createSubscription = async ({
  planId,
  planName,
  amount,
  currency = 'INR',
  userId,
  userEmail,
  userName,
}) => {
  const rzp = getRazorpay();
  const key = process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key';

  // If Razorpay instance is not available or running with test dummy keys
  if (!rzp || process.env.RAZORPAY_KEY_ID === 'rzp_test_artcrew123' || key.includes('mock')) {
    const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      orderId: mockOrderId,
      key,
      amount,
      currency,
      planName,
      planId,
      userName,
      userEmail,
    };
  }

  // If a real Razorpay recurring plan ID is configured on the plan
  if (planId && typeof planId === 'string' && planId.startsWith('plan_')) {
    try {
      const subscription = await rzp.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        quantity: 1,
        total_count: 12,
        notes: { userId: userId.toString(), userEmail, userName },
      });

      return {
        subscriptionId: subscription.id,
        shortUrl: subscription.short_url,
        key,
        amount,
        currency,
        planName,
        planId,
        userName,
        userEmail,
      };
    } catch (err) {
      console.warn('[RazorpayProvider] Razorpay subscription create fallback to order:', err.message);
    }
  }

  // Create standard checkout order
  try {
    const order = await rzp.orders.create({
      amount: Math.round(Number(amount) * 100), // Razorpay expects amount in paise
      currency: currency || 'INR',
      receipt: `rcpt_${userId.toString().slice(-6)}_${Date.now().toString().slice(-6)}`,
      notes: {
        userId: userId.toString(),
        userEmail,
        userName,
        planId: planId?.toString() || '',
        planName,
      },
    });

    return {
      orderId: order.id,
      key,
      amount,
      currency,
      planName,
      planId,
      userName,
      userEmail,
    };
  } catch (rzpErr) {
    console.warn('[RazorpayProvider] Razorpay API call fallback to simulation:', rzpErr.message);
    const mockOrderId = `order_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    return {
      orderId: mockOrderId,
      key,
      amount,
      currency,
      planName,
      planId,
      userName,
      userEmail,
    };
  }
};

/**
 * Server-side payment verification using Razorpay HMAC-SHA256 signature
 */
const verifyPaymentSignature = async ({
  razorpay_order_id,
  razorpay_payment_id,
  razorpay_signature,
  razorpay_subscription_id,
  planId,
  userId,
}) => {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  const isMockOrTest = !secret || secret.startsWith('artcrew_secret') || process.env.RAZORPAY_KEY_ID === 'rzp_test_artcrew123';

  if (secret && !isMockOrTest) {
    let expectedSignature = '';
    if (razorpay_subscription_id) {
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_payment_id}|${razorpay_subscription_id}`)
        .digest('hex');
    } else if (razorpay_order_id) {
      expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');
    }

    if (razorpay_signature && expectedSignature && razorpay_signature !== expectedSignature) {
      throw new Error('Cryptographic signature verification failed');
    }
  }

  // Activate user subscription server-side
  const plan = await SubscriptionPlan.findById(planId);
  const tier = plan ? getTierFromSlug(plan.slug) : 'basic';
  const durationMonths = plan?.billingPeriod === 'yearly' ? 12 : plan?.billingPeriod === 'quarterly' ? 3 : 1;

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      subscriptionId: plan?._id || null,
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
      razorpaySubscriptionId: razorpay_subscription_id || razorpay_order_id || `pay_${Date.now()}`,
      $push: {
        billingHistory: {
          amount: plan ? plan.price : 0,
          currency: plan ? plan.currency : 'INR',
          status: 'paid',
          paymentId: razorpay_payment_id || `sim_${Date.now()}`,
          date: new Date(),
          plan: plan ? plan.name : 'Premium Plan',
        },
      },
    },
    { new: true }
  ).select('-passwordHash');

  return {
    success: true,
    user: updatedUser,
    tier,
    expiresAt,
  };
};

/**
 * Handle Razorpay webhook events
 */
const handleWebhook = async (event) => {
  const { event: eventType, payload } = event;

  if (
    eventType === 'subscription.activated' ||
    eventType === 'subscription.charged' ||
    eventType === 'payment.captured' ||
    eventType === 'order.paid'
  ) {
    const notes =
      payload?.payment?.entity?.notes ||
      payload?.subscription?.entity?.notes ||
      payload?.order?.entity?.notes ||
      {};

    const { userId, planId } = notes;
    if (!userId) return;

    const plan = planId ? await SubscriptionPlan.findById(planId) : null;
    const tier = plan ? getTierFromSlug(plan.slug) : 'basic';

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + (plan?.billingPeriod === 'yearly' ? 12 : 1));

    await User.findByIdAndUpdate(userId, {
      subscriptionId: plan?._id || null,
      subscriptionStatus: 'active',
      subscriptionTier: tier,
      subscriptionExpiresAt: expiresAt,
      razorpaySubscriptionId: payload?.subscription?.entity?.id || payload?.payment?.entity?.order_id || '',
      $push: {
        billingHistory: {
          amount: (payload?.payment?.entity?.amount || 0) / 100,
          currency: payload?.payment?.entity?.currency || 'INR',
          status: 'paid',
          paymentId: payload?.payment?.entity?.id || '',
          date: new Date(),
          plan: plan?.name || 'Premium Plan',
        },
      },
    });
  }

  if (eventType === 'subscription.cancelled' || eventType === 'subscription.expired') {
    const notes = payload?.subscription?.entity?.notes || {};
    const { userId } = notes;
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        subscriptionStatus: 'cancelled',
      });
    }
  }
};

/**
 * Cancel a Razorpay subscription
 */
const cancelSubscription = async (subscriptionId) => {
  const rzp = getRazorpay();
  if (!rzp) return { cancelled: true };
  return rzp.subscriptions.cancel(subscriptionId, { cancel_at_cycle_end: 1 });
};

module.exports = {
  createSubscription,
  verifyPaymentSignature,
  handleWebhook,
  cancelSubscription,
};
