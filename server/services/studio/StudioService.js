const GooglePlacesProvider = require('./GooglePlacesProvider');
const OverpassProvider     = require('./OverpassProvider');
const Studio               = require('../../models/Studio');

/** Haversine formula — returns distance in km */
const haversineKm = (lat1, lon1, lat2, lon2) => {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a    =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/** Pick the best provider based on environment config */
const getProvider = () => {
  if (process.env.GOOGLE_PLACES_API_KEY) {
    return new GooglePlacesProvider(process.env.GOOGLE_PLACES_API_KEY);
  }
  return new OverpassProvider();
};

/**
 * Deduplicate by externalPlaceId or by proximity (< 50 m apart + same name prefix).
 */
const deduplicate = (studios) => {
  const seen = new Map();
  return studios.filter((s) => {
    if (s.externalPlaceId) {
      if (seen.has(s.externalPlaceId)) return false;
      seen.set(s.externalPlaceId, true);
      return true;
    }
    // Proximity-based dedup for OSM entries without stable IDs
    const key = `${s.name.slice(0, 6).toLowerCase()}-${s.latitude.toFixed(3)}-${s.longitude.toFixed(3)}`;
    if (seen.has(key)) return false;
    seen.set(key, true);
    return true;
  });
};

/**
 * StudioService — single entry point for studio search.
 *
 * Usage:
 *   const results = await StudioService.search({ lat, lon, radius, medium, keyword, sort });
 */
const StudioService = {
  /**
   * @param {object}  opts
   * @param {number}   opts.lat      User latitude
   * @param {number}   opts.lon      User longitude
   * @param {number}  [opts.radius]  Search radius in metres (default 10 000, max 50 000)
   * @param {string}  [opts.medium]  Art medium filter
   * @param {string}  [opts.keyword] Free-text keyword
   * @param {string}  [opts.sort]    'distance' (default) | 'rating'
   * @returns {Promise<NormalizedStudio[]>}
   */
  async search({ lat, lon, radius = 10000, medium, keyword, sort = 'distance' }) {
    const clampedRadius = Math.min(Number(radius), 50000);
    const provider      = getProvider();

    console.log(`[StudioService] Using ${provider.name} | lat=${lat} lon=${lon} r=${clampedRadius}m medium=${medium || 'any'}`);

    // 1. External provider search
    const [externalStudios, dbStudios] = await Promise.all([
      provider.search({ lat, lon, radius: clampedRadius, medium, keyword }).catch((err) => {
        console.error('[StudioService] Provider error:', err.message);
        return [];
      }),

      // 2. Manual studios from our own DB (~0.5° bbox ≈ 55 km)
      Studio.find({
        isActive:  true,
        latitude:  { $gte: lat - 0.5, $lte: lat + 0.5 },
        longitude: { $gte: lon - 0.5, $lte: lon + 0.5 },
        ...(medium ? { supportedMediums: { $elemMatch: { $regex: new RegExp(medium, 'i') } } } : {}),
      }).lean(),
    ]);

    // Normalize DB studios to the shared schema
    const dbNormalized = dbStudios.map((s) => ({
      id:               s._id.toString(),
      name:             s.name,
      address:          s.address || '',
      latitude:         s.latitude,
      longitude:        s.longitude,
      distance:         null,
      rating:           s.rating ?? null,
      totalRatings:     null,
      photos:           s.photos || [],
      website:          s.website || '',
      phone:            s.phone || '',
      hours:            s.hours || '',
      openNow:          null,
      supportedMediums: s.supportedMediums || [],
      source:           'manual',
      externalPlaceId:  s.externalPlaceId || s._id.toString(),
      description:      s.description || '',
    }));

    // 3. Merge, deduplicate, annotate with distance
    const merged = deduplicate([...externalStudios, ...dbNormalized]).map((s) => ({
      ...s,
      distance: haversineKm(lat, lon, s.latitude, s.longitude),
    }));

    // 4. Apply radius filter (external providers don't always honour radius exactly)
    const inRadius = merged.filter((s) => s.distance <= clampedRadius / 1000);

    // 5. Sort
    if (sort === 'rating') {
      inRadius.sort((a, b) => {
        // Null ratings go to bottom
        if (b.rating === null) return -1;
        if (a.rating === null) return 1;
        return b.rating - a.rating || a.distance - b.distance;
      });
    } else {
      inRadius.sort((a, b) => a.distance - b.distance);
    }

    return inRadius.slice(0, 30);
  },
};

module.exports = StudioService;
