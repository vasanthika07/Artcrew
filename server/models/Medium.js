const mongoose = require('mongoose');

const mediumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    coverImage: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    estimatedBudget: { type: String, default: '' },
    supplies: [{ type: String }],
    beginnerGuide: { type: String, default: '' },
    tags: [{ type: String }],
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

mediumSchema.index({ slug: 1 });
mediumSchema.index({ isActive: 1 });

module.exports = mongoose.model('Medium', mediumSchema);
