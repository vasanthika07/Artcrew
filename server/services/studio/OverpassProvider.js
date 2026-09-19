const axios = require('axios');
const StudioProvider = require('./StudioProvider');

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const TIMEOUT_S    = 25;

/**
 * OSM tag sets per art medium.
 * Each entry is an array of Overpass filter conditions to union together.
 */
const MEDIUM_OSM_TAGS = {
  painting:    [
    'node["amenity"="art_school"]',
    'node["craft"="painter"]',
    'node["leisure"="art"]',
    'way["amenity"="art_school"]',
  ],
  pottery:     [
    'node["craft"="pottery"]',
    'node["craft"="ceramics"]',
    'node["amenity"="art_school"]',
    'way["craft"="pottery"]',
  ],
  sculpture:   [
    'node["craft"="sculptor"]',
    'node["craft"="sculpture"]',
    'node["amenity"="art_school"]',
  ],
  printmaking: [
    'node["craft"="printmaker"]',
    'node["amenity"="art_school"]',
  ],
  'digital art': [
    'node["amenity"="art_school"]',
    'node["shop"="computer"]',
  ],
  calligraphy: [
    'node["craft"="calligrapher"]',
    'node["amenity"="art_school"]',
  ],
  charcoal:    [
    'node["amenity"="art_school"]',
    'node["craft"="painter"]',
  ],
  portrait:    [
    'node["craft"="painter"]',
    'node["amenity"="art_school"]',
  ],
  landscape:   [
    'node["craft"="painter"]',
    'node["amenity"="art_school"]',
  ],
};

/** Default tags when no medium is specified */
const DEFAULT_TAGS = [
  'node["amenity"="art_school"]',
  'node["shop"="art"]',
  'node["craft"="pottery"]',
  'node["craft"="sculptor"]',
  'node["craft"="painter"]',
  'node["craft"="ceramics"]',
  'node["leisure"="art"]',
  'way["amenity"="art_school"]',
  'way["shop"="art"]',
];

class OverpassProvider extends StudioProvider {
  /**
   * Build the Overpass QL query for given tags and bounding area.
   */
  _buildQuery(tags, lat, lon, radius) {
    const filters = tags
      .map((tag) => `${tag}(around:${radius},${lat},${lon});`)
      .join('\n      ');

    return `
      [out:json][timeout:${TIMEOUT_S}];
      (
        ${filters}
      );
      out body;
      >;
      out skel qt;
    `;
  }

  /**
   * Normalize an Overpass element to the shared studio schema.
   */
  _normalize(el, medium) {
    const tags = el.tags || {};
    const website = tags.website || tags['contact:website'] || tags['url'] || '';
    const phone   = tags.phone   || tags['contact:phone']  || tags['contact:mobile'] || '';
    const hours   = tags.opening_hours || '';

    const streetParts = [
      tags['addr:housenumber'],
      tags['addr:street'],
      tags['addr:city'],
    ].filter(Boolean);

    return {
      id:               `osm-${el.id}`,
      name:             tags.name || tags.operator || 'Art Studio',
      address:          streetParts.join(', '),
      latitude:         el.lat ?? el.center?.lat ?? 0,
      longitude:        el.lon ?? el.center?.lon ?? 0,
      distance:         null,
      rating:           null,
      totalRatings:     null,
      photos:           [],
      website:          website.startsWith('http') ? website : website ? `https://${website}` : '',
      phone,
      hours,
      openNow:          null,
      supportedMediums: medium ? [medium] : [],
      source:           'overpass',
      externalPlaceId:  String(el.id),
    };
  }

  async search({ lat, lon, radius, medium, keyword }) {
    const mediumKey = medium?.toLowerCase();
    const tags      = MEDIUM_OSM_TAGS[mediumKey] || DEFAULT_TAGS;
    const clampedRadius = Math.min(Number(radius) || 10000, 50000);
    const query     = this._buildQuery(tags, lat, lon, clampedRadius);

    try {
      const { data } = await axios.post(
        OVERPASS_URL,
        `data=${encodeURIComponent(query)}`,
        {
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeout: (TIMEOUT_S + 5) * 1000,
        }
      );

      const elements = (data.elements || []).filter(
        (el) => (el.lat || el.center?.lat) && el.tags?.name
      );

      // Keyword filter (client-side if needed)
      let filtered = elements;
      if (keyword) {
        const kw = keyword.toLowerCase();
        filtered = elements.filter((el) => {
          const tags = el.tags || {};
          return (
            (tags.name || '').toLowerCase().includes(kw) ||
            (tags.description || '').toLowerCase().includes(kw)
          );
        });
      }

      return filtered.map((el) => this._normalize(el, medium));
    } catch (err) {
      if (err.code === 'ECONNABORTED') {
        console.error('[Overpass] Timeout after', TIMEOUT_S + 5, 's');
      } else {
        console.error('[Overpass] search error:', err.message);
      }
      return [];
    }
  }
}

module.exports = OverpassProvider;
