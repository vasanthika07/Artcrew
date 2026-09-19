const mongoose = require('mongoose');

const watchProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recordingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecordedSession',
      required: true,
      index: true,
    },
    progressSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    lastWatchedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  { timestamps: true }
);

// Compound unique index so each user has at most one progress entry per recording
watchProgressSchema.index({ userId: 1, recordingId: 1 }, { unique: true });
watchProgressSchema.index({ userId: 1, lastWatchedAt: -1 });

module.exports = mongoose.model('WatchProgress', watchProgressSchema);
