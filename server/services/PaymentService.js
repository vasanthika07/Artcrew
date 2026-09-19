/**
 * Abstract PaymentService interface.
 * Currently implemented via Razorpay for India.
 * To switch to Stripe, create StripeProvider.js implementing the same interface.
 */

const RazorpayProvider = require('./RazorpayProvider');

// Active provider
const provider = RazorpayProvider;

/**
 * Create a subscription checkout session
 * @param {{ planId, planName, amount, currency, userId, userEmail, userName }} options
 * @returns {Promise<{ subscriptionId, shortUrl, key }>}
 */
const createSubscription = async (options) => {
  return provider.createSubscription(options);
};

/**
 * Handle incoming payment webhook event
 * @param {object} event
 */
const handleWebhook = async (event) => {
  return provider.handleWebhook(event);
};

/**
 * Cancel a subscription
 * @param {string} subscriptionId
 */
const cancelSubscription = async (subscriptionId) => {
  return provider.cancelSubscription(subscriptionId);
};

module.exports = { createSubscription, handleWebhook, cancelSubscription };
