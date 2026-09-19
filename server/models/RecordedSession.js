const mongoose = require('mongoose');

const recordedSessionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    mediumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medium', required: true },
    muxAssetId: { type: String, default: '' },
    muxPlaybackId: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    thumbnailUrl: { type: String, default: '' },
    durationSeconds: { type: Number, default: 0 },
    requiredTier: {
      type: String,
      enum: ['basic', 'pro', 'studio'],
      default: 'basic',
    },
    instructor: { type: String, default: '' },
    tags: [{ type: String }],
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

recordedSessionSchema.index({ mediumId: 1 });
recordedSessionSchema.index({ requiredTier: 1 });
recordedSessionSchema.index({ isPublished: 1 });

module.exports = mongoose.model('RecordedSession', recordedSessionSchema);
