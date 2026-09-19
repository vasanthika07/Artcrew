const axios = require('axios');
const StudioProvider = require('./StudioProvider');

const NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const DETAILS_URL = 'https://maps.googleapis.com/maps/api/place/details/json';
const PHOTO_URL   = 'https://maps.googleapis.com/maps/api/place/photo';

/**
 * Keyword sets to search for each art medium.
 * Keeps search specific enough to find relevant studios.
 */
const MEDIUM_KEYWORDS = {
  painting:    'painting art studio class',
  pottery:     'pottery ceramics studio class',
  sculpture:   'sculpture art studio class',
  printmaking: 'printmaking art studio',
  'digital art': 'digital art design studio',
  calligraphy: 'calligraphy lettering class',
  charcoal:    'charcoal drawing art class',
  portrait:    'portrait painting class',
  landscape:   'landscape painting class',
};

class GooglePlacesProvider extends StudioProvider {
  constructor(apiKey) {
    super();
    if (!apiKey) throw new Error('GooglePlacesProvider requires GOOGLE_PLACES_API_KEY');
    this.apiKey = apiKey;
  }

  /**
   * Build a public photo URL from a Google Places photo reference.
   * The key is used server-side only — it is never sent to the client.
   */
  _photoUrl(ref, maxWidth = 600) {
    return `${PHOTO_URL}?maxwidth=${maxWidth}&photoreference=${ref}&key=${this.apiKey}`;
  }

  /**
   * Normalize a Google Places result to the shared studio schema.
   */
  _normalize(place, medium) {
    const photos = (place.photos || [])
      .slice(0, 4)
      .map((p) => this._photoUrl(p.photo_reference));

    return {
      id:               place.place_id,
      name:             place.name || 'Unknown Studio',
      address:          place.vicinity || '',
      latitude:         place.geometry?.location?.lat ?? 0,
      longitude:        place.geometry?.location?.lng ?? 0,
      distance:         null, // populated by StudioService
      rating:           place.rating ?? null,
      totalRatings:     place.user_ratings_total ?? null,
      photos,
      website:          '', // Requires a Details call; we do that lazily
      phone:            '',
      hours:            place.opening_hours?.open_now != null
                          ? (place.opening_hours.open_now ? 'Open now' : 'Closed now')
                          : '',
      openNow:          place.opening_hours?.open_now ?? null,
      supportedMediums: medium ? [medium] : [],
      source:           'google',
      externalPlaceId:  place.place_id,
    };
  }

  async search({ lat, lon, radius, medium, keyword }) {
    const apiKey  = this.apiKey;
    const kw      = keyword || MEDIUM_KEYWORDS[medium?.toLowerCase()] || 'art studio class';
    const clampedRadius = Math.min(Number(radius) || 10000, 50000);

    try {
      const { data } = await axios.get(NEARBY_URL, {
        params: {
          location: `${lat},${lon}`,
          radius:   clampedRadius,
          keyword:  kw,
          key:      apiKey,
        },
        timeout: 12000,
      });

      if (data.status === 'REQUEST_DENIED') {
        console.error('[GooglePlaces] Request denied:', data.error_message);
        return [];
      }

      return (data.results || []).map((p) => this._normalize(p, medium));
    } catch (err) {
      console.error('[GooglePlaces] search error:', err.message);
      return [];
    }
  }
}

module.exports = GooglePlacesProvider;
