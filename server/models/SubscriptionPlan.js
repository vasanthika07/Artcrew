const mongoose = require('mongoose');

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, default: '' },
    price: { type: Number, required: true },
    currency: { type: String, default: 'INR' },
    billingPeriod: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
    includedMediums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medium' }],
    includesAllMediums: { type: Boolean, default: false },
    includesLiveSessions: { type: Boolean, default: false },
    includesRecordedSessions: { type: Boolean, default: false },
    maxDevices: { type: Number, default: 2 },
    features: [{ type: String }],
    razorpayPlanId: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SubscriptionPlan', subscriptionPlanSchema);
