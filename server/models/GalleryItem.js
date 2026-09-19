const mongoose = require('mongoose');

const galleryItemSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    mediumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Medium', required: true },
    imageUrl: { type: String, required: true },
    description: { type: String, default: '' },
    artist: { type: String, default: '' },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

galleryItemSchema.index({ mediumId: 1 });
galleryItemSchema.index({ isFeatured: 1 });
galleryItemSchema.index({ isPublished: 1 });

module.exports = mongoose.model('GalleryItem', galleryItemSchema);
