const axios = require('axios');
const StudioProvider = require('./StudioProvider');
const OverpassProvider = require('./OverpassProvider');

const NEW_PLACES_URL = 'https://places.googleapis.com/v1/places:searchText';
const LEGACY_NEARBY_URL = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo';

const MEDIUM_KEYWORDS = {
  painting: 'painting art studio class',
  pottery: 'pottery ceramics studio class',
  sculpture: 'sculpture art studio class',
  printmaking: 'printmaking art studio',
  'digital art': 'digital art design studio',
  calligraphy: 'calligraphy lettering class',
  charcoal: 'charcoal drawing art class',
  portrait: 'portrait painting class',
  landscape: 'landscape painting class',
};

class GooglePlacesProvider extends StudioProvider {
  constructor(apiKey) {
    super();
    if (!apiKey) throw new Error('GooglePlacesProvider requires GOOGLE_PLACES_API_KEY');
    this.apiKey = apiKey;
    this.overpassFallback = new OverpassProvider();
  }

  _photoUrl(ref, maxWidth = 600) {
    return `${PHOTO_URL}?maxwidth=${maxWidth}&photoreference=${ref}&key=${this.apiKey}`;
  }

  _normalizeLegacy(place, medium) {
    const photos = (place.photos || [])
      .slice(0, 4)
      .map((p) => this._photoUrl(p.photo_reference));

    return {
      id: place.place_id,
      name: place.name || 'Unknown Studio',
      address: place.vicinity || '',
      latitude: place.geometry?.location?.lat ?? 0,
      longitude: place.geometry?.location?.lng ?? 0,
      distance: null,
      rating: place.rating ?? null,
      totalRatings: place.user_ratings_total ?? null,
      photos,
      website: '',
      phone: '',
      hours: place.opening_hours?.open_now != null
        ? (place.opening_hours.open_now ? 'Open now' : 'Closed now')
        : '',
      openNow: place.opening_hours?.open_now ?? null,
      supportedMediums: medium ? [medium] : [],
      source: 'google',
      externalPlaceId: place.place_id,
    };
  }

  _normalizeNew(place, medium) {
    return {
      id: place.id,
      name: place.displayName?.text || 'Unknown Studio',
      address: place.formattedAddress || '',
      latitude: place.location?.latitude ?? 0,
      longitude: place.location?.longitude ?? 0,
      distance: null,
      rating: place.rating ?? null,
      totalRatings: place.userRatingCount ?? null,
      photos: [],
      website: place.websiteUri || '',
      phone: place.internationalPhoneNumber || '',
      hours: place.currentOpeningHours?.openNow != null
        ? (place.currentOpeningHours.openNow ? 'Open now' : 'Closed now')
        : '',
      openNow: place.currentOpeningHours?.openNow ?? null,
      supportedMediums: medium ? [medium] : [],
      source: 'google',
      externalPlaceId: place.id,
    };
  }

  async search({ lat, lon, radius, medium, keyword }) {
    const apiKey = this.apiKey;
    const kw = keyword || MEDIUM_KEYWORDS[medium?.toLowerCase()] || 'art studio class';
    const clampedRadius = Math.min(Number(radius) || 10000, 50000);

    // Try Places API (New) first
    try {
      const response = await axios.post(
        NEW_PLACES_URL,
        {
          textQuery: kw,
          locationBias: {
            circle: {
              center: { latitude: Number(lat), longitude: Number(lon) },
              radius: clampedRadius,
            },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.userRatingCount,places.websiteUri,places.internationalPhoneNumber,places.currentOpeningHours',
          },
          timeout: 8000,
        }
      );

      if (response.data && response.data.places && response.data.places.length > 0) {
        return response.data.places.map((p) => this._normalizeNew(p, medium));
      }
    } catch (err) {
      // If new API fails or is not enabled, try legacy API
    }

    // Try Legacy Places API
    try {
      const { data } = await axios.get(LEGACY_NEARBY_URL, {
        params: {
          location: `${lat},${lon}`,
          radius: clampedRadius,
          keyword: kw,
          key: apiKey,
        },
        timeout: 8000,
      });

      if (data.status === 'OK' && data.results) {
        return data.results.map((p) => this._normalizeLegacy(p, medium));
      }
    } catch (err) {
      // Fall through to Overpass
    }

    // Graceful fallback to OpenStreetMap Overpass provider if Google Places is blocked/disabled
    console.warn('[GooglePlaces] Google Places API not accessible. Falling back to OpenStreetMap provider.');
    return this.overpassFallback.search({ lat, lon, radius: clampedRadius, medium, keyword });
  }
}

module.exports = GooglePlacesProvider;
