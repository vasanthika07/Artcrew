const GalleryItem = require('../models/GalleryItem');
const Medium = require('../models/Medium');

// GET /api/gallery
const getGallery = async (req, res, next) => {
  try {
    const { medium, featured, search, all, page = 1, limit = 50 } = req.query;
    const filter = {};

    // Only filter isPublished if not explicitly querying all items (e.g. for admin)
    if (all !== 'true') {
      filter.isPublished = true;
    }

    if (medium && medium !== 'all') {
      const med = await Medium.findOne({
        $or: [{ slug: medium }, { name: { $regex: new RegExp(`^${medium}$`, 'i') } }],
      });
      if (med) {
        filter.mediumId = med._id;
      } else if (medium.match(/^[0-9a-fA-F]{24}$/)) {
        filter.mediumId = medium;
      }
    }

    if (featured === 'true') filter.isFeatured = true;

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { artist: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [items, total] = await Promise.all([
      GalleryItem.find(filter)
        .populate('mediumId', 'name slug')
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      GalleryItem.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/gallery/:id
const getGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findById(req.params.id).populate('mediumId', 'name slug');
    if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// POST /api/gallery (admin)
const createGalleryItem = async (req, res, next) => {
  try {
    const { title, mediumId, imageUrl, description, artist, isFeatured, isPublished, order } = req.body;
    if (!title || !mediumId || !imageUrl) {
      return res.status(422).json({ success: false, message: 'Title, mediumId, and imageUrl are required' });
    }
    const item = await GalleryItem.create({
      title,
      mediumId,
      imageUrl,
      description,
      artist,
      isFeatured: isFeatured !== undefined ? isFeatured : false,
      isPublished: isPublished !== undefined ? isPublished : true,
      order: order || 0,
    });
    await item.populate('mediumId', 'name slug');
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// PUT /api/gallery/:id (admin)
const updateGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('mediumId', 'name slug');
    if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found' });
    res.json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/gallery/:id (admin)
const deleteGalleryItem = async (req, res, next) => {
  try {
    const item = await GalleryItem.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Gallery item not found' });
    res.json({ success: true, message: 'Gallery item deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getGallery,
  getGalleryItem,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,
};
