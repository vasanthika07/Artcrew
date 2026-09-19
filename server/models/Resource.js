const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    mediumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medium', required: true },
    description: { type: String, default: '' },
    url: { type: String, required: true },
    resourceType: {
      type: String,
      enum: ['guide', 'video', 'course', 'community', 'supply-list', 'tips'],
      default: 'guide',
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner',
    },
    isFree: { type: Boolean, default: true },
    provider: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

resourceSchema.index({ mediumId: 1 });
resourceSchema.index({ resourceType: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
