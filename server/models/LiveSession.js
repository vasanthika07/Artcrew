const mongoose = require('mongoose');

const liveSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    mediumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medium', required: true },
    scheduledAt: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    streamUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    requiredTier: {
      type: String,
      enum: ['basic', 'pro', 'studio'],
      default: 'basic',
    },
    status: {
      type: String,
      enum: ['scheduled', 'live', 'ended'],
      default: 'scheduled',
    },
    host: { type: String, default: '' },
    maxAttendees: { type: Number, default: 100 },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

liveSessionSchema.index({ status: 1 });
liveSessionSchema.index({ scheduledAt: 1 });
liveSessionSchema.index({ mediumId: 1 });

module.exports = mongoose.model('LiveSession', liveSessionSchema);
