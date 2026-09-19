/**
 * StudioProvider — abstract base class for studio search providers.
 *
 * All providers must implement the `search` method and return a normalized
 * array of studio objects conforming to the schema below.
 *
 * Normalized studio schema:
 * {
 *   id:               string   — unique stable ID (provider-specific)
 *   name:             string
 *   address:          string
 *   latitude:         number
 *   longitude:        number
 *   distance:         number   — km (populated by StudioService, not the provider)
 *   rating:           number|null
 *   totalRatings:     number|null
 *   photos:           string[] — public URLs
 *   website:          string
 *   phone:            string
 *   hours:            string   — human-readable or opening_hours format
 *   openNow:          boolean|null
 *   supportedMediums: string[]
 *   source:           'google'|'overpass'|'manual'
 *   externalPlaceId:  string
 * }
 */
class StudioProvider {
  /**
   * Search for art studios near a location.
   *
   * @param {object} options
   * @param {number}   options.lat      Latitude
   * @param {number}   options.lon      Longitude
   * @param {number}   options.radius   Search radius in metres (max 50 000)
   * @param {string}  [options.medium]  Art medium keyword filter
   * @param {string}  [options.keyword] Free-text keyword
   * @returns {Promise<NormalizedStudio[]>}
   */
  async search({ lat, lon, radius, medium, keyword }) {
    throw new Error(`${this.constructor.name}.search() is not implemented`);
  }

  /** Provider name — used in logging and source field */
  get name() {
    return this.constructor.name;
  }
}

module.exports = StudioProvider;
