/**
 * Abstract PaymentService interface.
 * Implemented via RazorpayProvider.
 */

const RazorpayProvider = require('./RazorpayProvider');

const provider = RazorpayProvider;

/**
 * Create a subscription checkout session / order
 */
const createSubscription = async (options) => {
  return provider.createSubscription(options);
};

/**
 * Verify server-side payment signature and activate subscription
 */
const verifyPaymentSignature = async (options) => {
  return provider.verifyPaymentSignature(options);
};

/**
 * Handle incoming payment webhook event
 */
const handleWebhook = async (event) => {
  return provider.handleWebhook(event);
};

/**
 * Cancel a subscription
 */
const cancelSubscription = async (subscriptionId) => {
  return provider.cancelSubscription(subscriptionId);
};

module.exports = {
  createSubscription,
  verifyPaymentSignature,
  handleWebhook,
  cancelSubscription,
};
