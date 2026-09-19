const mongoose = require('mongoose');
const Medium = require('../models/Medium');
const Resource = require('../models/Resource');
const GalleryItem = require('../models/GalleryItem');
const RecordedSession = require('../models/RecordedSession');
const LiveSession = require('../models/LiveSession');

// GET /api/mediums
const getMediums = async (req, res, next) => {
  try {
    const mediums = await Medium.find({ isActive: true }).sort({ order: 1, name: 1 });
    res.json({ success: true, data: mediums });
  } catch (error) {
    next(error);
  }
};

// GET /api/mediums/:id
const getMedium = async (req, res, next) => {
  try {
    const isId = mongoose.Types.ObjectId.isValid(req.params.id);
    const medium = isId
      ? await Medium.findById(req.params.id)
      : await Medium.findOne({ slug: req.params.id });
    if (!medium) return res.status(404).json({ success: false, message: 'Medium not found' });

    // Fetch related content
    const [resources, gallery, recordings, liveSessions] = await Promise.all([
      Resource.find({ mediumId: medium._id, isActive: true }),
      GalleryItem.find({ mediumId: medium._id, isPublished: true }).limit(6),
      RecordedSession.find({ mediumId: medium._id, isPublished: true }).limit(6),
      LiveSession.find({ mediumId: medium._id, isPublished: true }).limit(6),
    ]);

    res.json({
      success: true,
      data: { ...medium.toObject(), resources, gallery, recordings, liveSessions },
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/mediums (admin)
const createMedium = async (req, res, next) => {
  try {
    const { name, description, coverImage, difficulty, estimatedBudget, supplies, beginnerGuide, tags, order } = req.body;

    if (!name || !description) {
      return res.status(422).json({ success: false, message: 'Name and description are required' });
    }

    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const medium = await Medium.create({
      name,
      slug,
      description,
      coverImage,
      difficulty,
      estimatedBudget,
      supplies: supplies || [],
      beginnerGuide,
      tags: tags || [],
      order: order || 0,
    });

    res.status(201).json({ success: true, data: medium });
  } catch (error) {
    next(error);
  }
};

// PUT /api/mediums/:id (admin)
const updateMedium = async (req, res, next) => {
  try {
    const medium = await Medium.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!medium) return res.status(404).json({ success: false, message: 'Medium not found' });
    res.json({ success: true, data: medium });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/mediums/:id (admin)
const deleteMedium = async (req, res, next) => {
  try {
    const medium = await Medium.findByIdAndDelete(req.params.id);
    if (!medium) return res.status(404).json({ success: false, message: 'Medium not found' });
    // Also delete associated resources
    await Resource.deleteMany({ mediumId: req.params.id });
    res.json({ success: true, message: 'Medium and associated resources deleted' });
  } catch (error) {
    next(error);
  }
};

// GET /api/mediums/:id/resources
const getMediumResources = async (req, res, next) => {
  try {
    const resources = await Resource.find({ mediumId: req.params.id }).sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (error) {
    next(error);
  }
};

// POST /api/mediums/:id/resources (admin)
const createMediumResource = async (req, res, next) => {
  try {
    const { title, description, url, resourceType, level, isFree, provider } = req.body;
    if (!title || !url) {
      return res.status(422).json({ success: false, message: 'Title and URL are required' });
    }

    const resource = await Resource.create({
      title,
      mediumId: req.params.id,
      description: description || '',
      url,
      resourceType: resourceType || 'guide',
      level: level || 'beginner',
      isFree: isFree !== undefined ? isFree : true,
      provider: provider || 'External',
      isActive: true,
    });

    res.status(201).json({ success: true, data: resource });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/mediums/:id/resources/:resourceId (admin)
const deleteMediumResource = async (req, res, next) => {
  try {
    const resource = await Resource.findByIdAndDelete(req.params.resourceId);
    if (!resource) return res.status(404).json({ success: false, message: 'Resource not found' });
    res.json({ success: true, message: 'Resource deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMediums,
  getMedium,
  createMedium,
  updateMedium,
  deleteMedium,
  getMediumResources,
  createMediumResource,
  deleteMediumResource,
};
