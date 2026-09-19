const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    address: { type: String, default: '' },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    rating: { type: Number, default: null, min: 0, max: 5 },
    hours: { type: String, default: '' },
    photos: [{ type: String }],
    website: { type: String, default: '' },
    phone: { type: String, default: '' },
    supportedMediums: [{ type: String }],
    source: { type: String, enum: ['google', 'overpass', 'manual'], default: 'manual' },
    externalPlaceId: { type: String, default: '' },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

studioSchema.index({ latitude: 1, longitude: 1 });
studioSchema.index({ supportedMediums: 1 });
studioSchema.index({ source: 1 });

module.exports = mongoose.model('Studio', studioSchema);
