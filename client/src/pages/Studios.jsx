import { useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Navigation, Search, SlidersHorizontal, ChevronDown, MapPin, Compass } from 'lucide-react';
import { toast } from '../components/Toast';
import useStudioSearch from '../hooks/useStudioSearch';
import LocationSearch  from '../components/studios/LocationSearch';
import MediumSelector  from '../components/studios/MediumSelector';
import StudioFinder    from '../components/studios/StudioFinder';

const RADIUS_OPTIONS = [
  { value: 3000,  label: '3 km' },
  { value: 5000,  label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 20000, label: '20 km' },
  { value: 50000, label: '50 km' },
];

const Studios = () => {
  const [searchParams]     = useSearchParams();
  const [locationText, setLocationText] = useState('');

  const {
    studios, loading, error, hasSearched, userLocation, provider,
    sort, medium, radius,
    setSort, setMedium, setRadius, setUserLocation,
    search, geolocate, geocodeAndSearch,
  } = useStudioSearch({
    medium: searchParams.get('medium') || '',
    radius: 10000,
    sort:   'distance',
  });

  /* ─── Handlers ──────────────────────────────── */

  const POPULAR_CITIES = [
    { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
    { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
    { name: 'Delhi NCR', lat: 28.6139, lon: 77.2090 },
    { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
    { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
    { name: 'Pune', lat: 18.5204, lon: 73.8567 },
    { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  ];

  const handleLocationSelect = useCallback(({ lat, lon, displayName }) => {
    setLocationText(displayName);
    setUserLocation({ lat, lon });
    search(lat, lon);
  }, [search, setUserLocation]);

  const handleLocationSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!locationText.trim()) return;
    try {
      const loc = await geocodeAndSearch(locationText);
      setLocationText(loc.displayName);
    } catch (err) {
      toast.error(err.message);
    }
  }, [locationText, geocodeAndSearch]);

  const handleGeolocate = useCallback(async () => {
    toast.info('Detecting your location…');
    try {
      const loc = await geolocate();
      if (loc?.displayName) {
        setLocationText(loc.displayName);
        toast.success(`Location set: ${loc.displayName}`);
      } else {
        toast.success('Found nearby studios for your location');
      }
    } catch (err) {
      toast.error(err.message || 'Could not get location. Try searching a city.');
    }
  }, [geolocate]);

  const handleCityPick = useCallback((city) => {
    setLocationText(city.name);
    setUserLocation({ lat: city.lat, lon: city.lon });
    search(city.lat, city.lon);
    toast.info(`Showing studios in ${city.name}`);
  }, [search, setUserLocation]);

  const handleMediumChange = useCallback((newMedium) => {
    setMedium(newMedium);
    // Re-search if we already have a location
    if (userLocation) {
      // Delay 1 tick so setMedium has updated the ref
      setTimeout(() => search(userLocation.lat, userLocation.lon), 0);
    }
  }, [setMedium, userLocation, search]);

  const handleRadiusChange = useCallback((newRadius) => {
    setRadius(newRadius);
    if (userLocation) {
      setTimeout(() => search(userLocation.lat, userLocation.lon), 0);
    }
  }, [setRadius, userLocation, search]);

  const handleSort = useCallback((newSort) => {
    setSort(newSort);
  }, [setSort]);

  const handleSearchArea = useCallback((lat, lon) => {
    search(lat, lon);
  }, [search]);

  const handleRetry = useCallback(() => {
    if (userLocation) search(userLocation.lat, userLocation.lon);
  }, [userLocation, search]);

  /* ─── Render ─────────────────────────────────── */

  return (
    <div className="min-h-screen bg-cream">

      {/* ═══ Hero Search Header ═══ */}
      <header className="bg-art-gradient relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-hero-pattern opacity-30" aria-hidden="true" />
        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-canvas-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-terracotta-500/10 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative container-art py-14">
          <div className="max-w-3xl">
            <p className="eyebrow-light animate-fade-in">Near You</p>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4 animate-fade-up leading-tight">
              Find Art Studios
            </h1>
            <p className="text-charcoal-300 text-lg mb-8 max-w-xl animate-fade-up delay-100">
              Discover pottery classes, painting workshops, and creative spaces near your location.
            </p>

            {/* ── Search card ── */}
            <div className="bg-charcoal-900/70 backdrop-blur-md rounded-2xl p-5 border border-charcoal-700/60 space-y-4 animate-fade-up delay-200 shadow-dark-lg">

              {/* Location search row */}
              <form
                onSubmit={handleLocationSubmit}
                className="flex gap-2.5"
                role="search"
                aria-label="Studio location search"
              >
                <LocationSearch
                  value={locationText}
                  onChange={setLocationText}
                  onSelect={handleLocationSelect}
                  placeholder="Search a city or area…"
                  dark
                  className="flex-1"
                />
                <button
                  type="submit"
                  className="btn-primary px-5 shrink-0"
                  aria-label="Search studios at this location"
                  disabled={loading}
                >
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleGeolocate}
                  disabled={loading}
                  className="btn border border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-300 px-4 transition-all shrink-0"
                  aria-label="Use my current location"
                >
                  <Navigation className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">My Location</span>
                </button>
              </form>

              {/* Filters row */}
              <div className="space-y-3">
                {/* Medium selector */}
                <MediumSelector value={medium} onChange={handleMediumChange} dark />

                {/* Radius + provider info row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <SlidersHorizontal className="w-4 h-4 text-charcoal-500 shrink-0" aria-hidden="true" />
                  <div className="relative">
                    <select
                      value={radius}
                      onChange={(e) => handleRadiusChange(Number(e.target.value))}
                      aria-label="Search radius"
                      className="select-dark appearance-none pl-3 pr-8"
                    >
                      {RADIUS_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>Within {label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400 pointer-events-none" aria-hidden="true" />
                  </div>

                  {/* Provider badge */}
                  {provider && (
                    <span className="text-[11px] text-charcoal-500 ml-auto">
                      via {provider === 'google' ? '🔵 Google Places' : '🗺️ OpenStreetMap'}
                    </span>
                  )}
                </div>

                {/* Quick Indian Art Hubs Chips */}
                <div className="pt-2 border-t border-charcoal-800/60 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-charcoal-400 font-medium mr-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-canvas-400" /> Popular:
                  </span>
                  {POPULAR_CITIES.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => handleCityPick(c)}
                      className="text-[11px] px-2.5 py-1 rounded-full bg-charcoal-800/80 hover:bg-canvas-500/20 text-charcoal-300 hover:text-canvas-300 border border-charcoal-700/80 hover:border-canvas-500/40 transition-all cursor-pointer"
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ═══ Results ═══ */}
      <main className="container-art py-10">
        {!hasSearched ? (
          /* ── Initial call-to-action ── */
          <div className="text-center py-20 animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-canvas-100 rotate-6" aria-hidden="true" />
              <div className="absolute inset-0 rounded-3xl bg-white border border-canvas-100 flex items-center justify-center shadow-card">
                <Compass className="w-10 h-10 text-canvas-400" aria-hidden="true" />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-3">
              Discover Studios Near You
            </h2>
            <p className="text-charcoal-500 mb-8 max-w-sm mx-auto">
              Share your location or type a city to find art studios, pottery classes, sculpture workshops, and creative spaces nearby.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={handleGeolocate}
                className="btn-primary"
                aria-label="Use my current location to find studios"
              >
                <Navigation className="w-4 h-4" aria-hidden="true" />
                Use My Location
              </button>
              <span className="text-sm text-charcoal-400">or search a city above</span>
            </div>

            {/* Medium chips for quick-start */}
            <div className="mt-10">
              <p className="text-xs text-charcoal-400 uppercase tracking-wider mb-3">Popular mediums</p>
              <div className="flex flex-wrap justify-center gap-2">
                {['Painting', 'Pottery', 'Sculpture', 'Calligraphy', 'Digital Art'].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMedium(m.toLowerCase());
                      handleGeolocate();
                    }}
                    className="px-4 py-2 rounded-full border border-charcoal-200 text-sm text-charcoal-600 hover:border-canvas-400 hover:text-canvas-600 hover:bg-canvas-50 transition-all"
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ── Studio Finder ── */
          <StudioFinder
            studios={studios}
            loading={loading}
            error={error}
            hasSearched={hasSearched}
            userLocation={userLocation}
            provider={provider}
            sort={sort}
            onSort={handleSort}
            onSearch={handleSearchArea}
            onRetry={handleRetry}
          />
        )}
      </main>
    </div>
  );
};

export default Studios;
