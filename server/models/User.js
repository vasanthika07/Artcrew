const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  deviceId: { type: String, required: true },
  refreshToken: { type: String, required: true },
  userAgent: { type: String, default: '' },
  lastActive: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
});

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    subscriptionId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubscriptionPlan', default: null },
    subscriptionStatus: {
      type: String,
      enum: ['none', 'active', 'expired', 'cancelled'],
      default: 'none',
    },
    subscriptionTier: { type: String, default: null },
    subscriptionExpiresAt: { type: Date, default: null },
    razorpaySubscriptionId: { type: String, default: null },
    devices: [deviceSchema],
    maxDevices: { type: Number, default: 2 },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    savedMediums: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Medium' }],
    bookmarkedStudios: [{ type: String }],
    preferences: {
      onboardingQuiz: { type: Object, default: {} },
      recommendedMedium: { type: mongoose.Schema.Types.ObjectId, ref: 'Medium', default: null },
      favoriteMediums: [{ type: String }],
    },
    billingHistory: [
      {
        amount: Number,
        currency: String,
        status: String,
        paymentId: String,
        date: { type: Date, default: Date.now },
        plan: String,
      },
    ],
  },
  { timestamps: true }
);

userSchema.index({ role: 1 });

module.exports = mongoose.model('User', userSchema);
