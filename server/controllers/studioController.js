const Studio       = require('../models/Studio');
const StudioService = require('../services/studio/StudioService');

/** Validate lat/lon are numeric and within WGS-84 bounds */
const validateCoords = (lat, lon) => {
  const numLat = parseFloat(lat);
  const numLon = parseFloat(lon);
  if (isNaN(numLat) || isNaN(numLon))   return { error: 'lat and lon must be numbers' };
  if (numLat < -90  || numLat > 90)     return { error: 'lat must be between -90 and 90' };
  if (numLon < -180 || numLon > 180)    return { error: 'lon must be between -180 and 180' };
  return { lat: numLat, lon: numLon };
};

/**
 * GET /api/studios/nearby
 *
 * Query params:
 *   lat      {number}  Required
 *   lon      {number}  Required
 *   radius   {number}  Metres, default 10000, max 50000
 *   medium   {string}  Art medium filter
 *   keyword  {string}  Free-text keyword
 *   sort     {string}  'distance' (default) | 'rating'
 */
const getNearbyStudios = async (req, res, next) => {
  try {
    const lat = req.query.lat || req.query.latitude;
    const lon = req.query.lon || req.query.lng || req.query.longitude;
    const { radius, medium, keyword, sort } = req.query;

    if (!lat || !lon) {
      return res.status(422).json({
        success: false,
        message: 'lat and lon (or latitude and longitude) query parameters are required',
        code:    'MISSING_COORDINATES',
      });
    }

    const coords = validateCoords(lat, lon);
    if (coords.error) {
      return res.status(422).json({
        success: false,
        message: coords.error,
        code:    'INVALID_COORDINATES',
      });
    }

    const studios = await StudioService.search({
      lat:     coords.lat,
      lon:     coords.lon,
      radius:  radius ? Math.min(Math.abs(Number(radius)), 50000) : 10000,
      medium:  medium  || undefined,
      keyword: keyword || undefined,
      sort:    ['distance', 'rating'].includes(sort) ? sort : 'distance',
    });

    res.json({
      success:  true,
      count:    studios.length,
      data:     studios,
      provider: process.env.GOOGLE_PLACES_API_KEY ? 'google' : 'overpass',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/studios
 * Returns manually added studio records from the DB only.
 */
const getStudios = async (req, res, next) => {
  try {
    const studios = await Studio.find({ isActive: true }).sort({ createdAt: -1 });
    res.json({ success: true, data: studios });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/studios  (admin only)
 * Manually create a studio record.
 */
const createStudio = async (req, res, next) => {
  try {
    const { name, address, latitude, longitude } = req.body;

    if (!name || latitude == null || longitude == null) {
      return res.status(422).json({
        success: false,
        message: 'name, latitude and longitude are required',
      });
    }

    const coords = validateCoords(latitude, longitude);
    if (coords.error) {
      return res.status(422).json({ success: false, message: coords.error });
    }

    const studio = await Studio.create({
      ...req.body,
      source: 'manual',
    });

    res.status(201).json({ success: true, data: studio });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/studios/:id  (admin only)
 */
const updateStudio = async (req, res, next) => {
  try {
    const studio = await Studio.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!studio) return res.status(404).json({ success: false, message: 'Studio not found' });
    res.json({ success: true, data: studio });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/studios/:id  (admin only)
 */
const deleteStudio = async (req, res, next) => {
  try {
    const studio = await Studio.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!studio) return res.status(404).json({ success: false, message: 'Studio not found' });
    res.json({ success: true, message: 'Studio deactivated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNearbyStudios, getStudios, createStudio, updateStudio, deleteStudio };
