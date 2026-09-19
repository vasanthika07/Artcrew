import { useState, useCallback, useEffect, useRef } from 'react';
import {
  ArrowUpDown, Star, Navigation, Map, List,
  AlertCircle, WifiOff, Loader2, MapPin, RotateCcw,
  SlidersHorizontal, TrendingUp
} from 'lucide-react';
import StudioCard   from './StudioCard';
import StudioMap    from './StudioMap';
import StudioDetails from './StudioDetails';

/* ─── Skeleton loader ─────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl border border-charcoal-100 overflow-hidden h-28 flex gap-0 animate-pulse">
    <div className="w-24 shrink-0 bg-charcoal-100" />
    <div className="flex-1 p-3 space-y-2">
      <div className="h-4 bg-charcoal-100 rounded-lg w-3/4" />
      <div className="h-3 bg-charcoal-100 rounded-lg w-1/2" />
      <div className="h-3 bg-charcoal-100 rounded-lg w-1/3" />
      <div className="flex gap-1.5 mt-2">
        <div className="h-5 bg-charcoal-100 rounded-lg w-20" />
        <div className="h-5 bg-charcoal-100 rounded-lg w-7" />
      </div>
    </div>
  </div>
);

/* ─── Error / empty states ───────────────────────────── */
const ErrorIcon = ({ code }) => {
  if (code === 'NETWORK_ERROR' || code === 'OFFLINE') return <WifiOff className="w-8 h-8" aria-hidden="true" />;
  if (code === 'NO_RESULTS') return <MapPin className="w-8 h-8" aria-hidden="true" />;
  return <AlertCircle className="w-8 h-8" aria-hidden="true" />;
};

const ErrorState = ({ error, onRetry }) => (
  <div className="flex flex-col items-center justify-center py-14 px-6 text-center" role="alert" aria-live="assertive">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
      error.code === 'NO_RESULTS' ? 'bg-canvas-50 text-canvas-400' : 'bg-red-50 text-red-400'
    }`}>
      <ErrorIcon code={error.code} />
    </div>
    <h3 className="font-display font-semibold text-charcoal-800 text-base mb-2">
      {error.code === 'NO_RESULTS' ? 'No Studios Found' :
       error.code === 'PERMISSION_DENIED' ? 'Location Access Denied' :
       error.code === 'NETWORK_ERROR' ? 'Connection Issue' : 'Something Went Wrong'}
    </h3>
    <p className="text-sm text-charcoal-500 max-w-xs leading-relaxed">{error.message}</p>
    {onRetry && error.code !== 'NO_RESULTS' && error.code !== 'PERMISSION_DENIED' && (
      <button
        onClick={onRetry}
        className="mt-5 flex items-center gap-2 px-4 py-2 rounded-xl bg-canvas-500 hover:bg-canvas-600 text-white text-sm font-medium transition-colors"
      >
        <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
        Try Again
      </button>
    )}
  </div>
);

/* ─── Sort bar ───────────────────────────────────────── */
const SortBar = ({ sort, onSort, count, loading }) => (
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-2">
      <h2 className="font-display font-semibold text-charcoal-900 text-base" aria-live="polite" aria-atomic="true">
        {loading ? 'Searching…' : `${count} Studio${count !== 1 ? 's' : ''}`}
      </h2>
      {!loading && count > 0 && (
        <span className="text-xs text-charcoal-400">found</span>
      )}
    </div>
    <div className="flex items-center gap-1 bg-charcoal-100 rounded-xl p-1" role="group" aria-label="Sort results">
      <button
        onClick={() => onSort('distance')}
        aria-pressed={sort === 'distance'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          sort === 'distance' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700'
        }`}
      >
        <Navigation className="w-3 h-3" aria-hidden="true" />
        Distance
      </button>
      <button
        onClick={() => onSort('rating')}
        aria-pressed={sort === 'rating'}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
          sort === 'rating' ? 'bg-white text-charcoal-900 shadow-sm' : 'text-charcoal-500 hover:text-charcoal-700'
        }`}
      >
        <Star className="w-3 h-3" aria-hidden="true" />
        Rating
      </button>
    </div>
  </div>
);

/* ─── Main StudioFinder orchestrator ─────────────────── */
/**
 * StudioFinder — split-screen studio discovery UI.
 *
 * Props:
 *   studios        {array}          Normalized studio array from useStudioSearch
 *   loading        {boolean}
 *   error          {object|null}    { code, message } or null
 *   hasSearched    {boolean}
 *   userLocation   {object|null}    { lat, lon }
 *   provider       {string|null}    'google' | 'overpass'
 *   sort           {string}         'distance' | 'rating'
 *   onSort         {fn}
 *   onSearch       {fn(lat, lon)}   Called to re-search with new coords
 *   onRetry        {fn}             Called on error retry button click
 */
const StudioFinder = ({
  studios       = [],
  loading       = false,
  error         = null,
  hasSearched   = false,
  userLocation  = null,
  provider      = null,
  sort          = 'distance',
  onSort,
  onSearch,
  onRetry,
}) => {
  const [selectedStudio, setSelectedStudio] = useState(null);
  const [mobileView,     setMobileView]     = useState('list'); // 'list' | 'map'
  const [mapBounds,      setMapBounds]      = useState(null);
  const [showSearchBtn,  setShowSearchBtn]  = useState(false);
  const listRef = useRef(null);

  // When a studio is selected via list, scroll it into view
  useEffect(() => {
    if (!selectedStudio) return;
    const el = document.getElementById(`studio-card-${selectedStudio.id || selectedStudio.externalPlaceId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedStudio]);

  // Reset selection & search button when studios change
  useEffect(() => {
    setSelectedStudio(null);
    setShowSearchBtn(false);
  }, [studios]);

  const handleStudioSelect = useCallback((studio) => {
    setSelectedStudio(studio);
    // On mobile, switch to map when a card is clicked
    if (window.innerWidth < 1024) setMobileView('map');
  }, []);

  const handleMapSelect = useCallback((studio) => {
    setSelectedStudio(studio);
  }, []);

  const handleBoundsChange = useCallback((bounds) => {
    setMapBounds(bounds);
    setShowSearchBtn(true);
  }, []);

  const handleSearchThisArea = useCallback(() => {
    if (!mapBounds) return;
    setShowSearchBtn(false);
    onSearch?.(mapBounds.lat, mapBounds.lon);
  }, [mapBounds, onSearch]);

  const handleCloseDetails = useCallback(() => setSelectedStudio(null), []);

  // ─── Render helpers ───────────────────────────────────

  const renderList = () => {
    if (loading) return (
      <div className="space-y-3" aria-label="Loading studios" aria-busy="true">
        {[...Array(5)].map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );

    if (error) return <ErrorState error={error} onRetry={onRetry} />;

    if (!studios.length) return (
      <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-canvas-50 flex items-center justify-center mb-4">
          <MapPin className="w-7 h-7 text-canvas-400" aria-hidden="true" />
        </div>
        <h3 className="font-display font-semibold text-charcoal-800 text-base mb-2">No Studios Found</h3>
        <p className="text-sm text-charcoal-500 max-w-xs">Try expanding the search radius, choosing a different medium, or panning the map and clicking "Search This Area".</p>
      </div>
    );

    return (
      <div
        ref={listRef}
        className="space-y-2.5 overflow-y-auto max-h-full pr-0.5 scrollbar-hide"
        role="list"
        aria-label={`${studios.length} studios found`}
      >
        {studios.map((studio, i) => (
          <div
            key={studio.id || studio.externalPlaceId || i}
            role="listitem"
            className="animate-fade-up"
            style={{ animationDelay: `${Math.min(i, 8) * 40}ms`, animationFillMode: 'both' }}
          >
            <StudioCard
              studio={studio}
              isSelected={
                selectedStudio?.id === studio.id ||
                selectedStudio?.externalPlaceId === studio.externalPlaceId
              }
              onSelect={handleStudioSelect}
            />
          </div>
        ))}

        {/* Provider attribution */}
        {provider && (
          <p className="text-center text-[11px] text-charcoal-400 py-3">
            Results via {provider === 'google' ? 'Google Places' : 'OpenStreetMap'}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="relative">
      {/* ── Desktop: split 2/5 list | 3/5 map ── */}
      <div className="hidden lg:grid lg:grid-cols-5 gap-6">

        {/* List panel */}
        <section
          className="lg:col-span-2 flex flex-col"
          style={{ height: 'calc(100vh - 280px)', minHeight: 520 }}
          aria-label="Studio list"
        >
          <SortBar sort={sort} onSort={onSort} count={studios.length} loading={loading} />
          <div className="flex-1 min-h-0">
            {renderList()}
          </div>
        </section>

        {/* Map panel */}
        <section
          className="lg:col-span-3 sticky top-20 rounded-2xl overflow-hidden border border-charcoal-200 shadow-card"
          style={{ height: 'calc(100vh - 280px)', minHeight: 520 }}
          aria-label="Studio map"
        >
          <StudioMap
            studios={studios}
            userLocation={userLocation}
            selectedStudio={selectedStudio}
            onStudioSelect={handleMapSelect}
            onBoundsChange={handleBoundsChange}
            onSearchThisArea={handleSearchThisArea}
            showSearchButton={showSearchBtn && !loading}
          />
        </section>
      </div>

      {/* ── Mobile: tabbed list / map ── */}
      <div className="lg:hidden">
        {/* Mobile sort bar */}
        {hasSearched && (
          <SortBar sort={sort} onSort={onSort} count={studios.length} loading={loading} />
        )}

        {/* Mobile tab toggle */}
        <div className="flex bg-charcoal-100 rounded-2xl p-1 mb-4" role="tablist" aria-label="Switch between list and map view">
          <button
            role="tab"
            id="tab-list"
            aria-controls="panel-list"
            aria-selected={mobileView === 'list'}
            onClick={() => setMobileView('list')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              mobileView === 'list'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            <List className="w-4 h-4" aria-hidden="true" />
            List {!loading && studios.length > 0 && `(${studios.length})`}
          </button>
          <button
            role="tab"
            id="tab-map"
            aria-controls="panel-map"
            aria-selected={mobileView === 'map'}
            onClick={() => setMobileView('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              mobileView === 'map'
                ? 'bg-white text-charcoal-900 shadow-sm'
                : 'text-charcoal-500 hover:text-charcoal-700'
            }`}
          >
            <Map className="w-4 h-4" aria-hidden="true" />
            Map
          </button>
        </div>

        {/* Mobile list panel */}
        <div
          id="panel-list"
          role="tabpanel"
          aria-labelledby="tab-list"
          hidden={mobileView !== 'list'}
        >
          <div className="space-y-2.5">
            {renderList()}
          </div>
        </div>

        {/* Mobile map panel */}
        <div
          id="panel-map"
          role="tabpanel"
          aria-labelledby="tab-map"
          hidden={mobileView !== 'map'}
          className="rounded-2xl overflow-hidden border border-charcoal-200 shadow-card"
          style={{ height: '65vh', minHeight: 420 }}
        >
          <StudioMap
            studios={studios}
            userLocation={userLocation}
            selectedStudio={selectedStudio}
            onStudioSelect={handleMapSelect}
            onBoundsChange={handleBoundsChange}
            onSearchThisArea={handleSearchThisArea}
            showSearchButton={showSearchBtn && !loading}
          />
        </div>
      </div>

      {/* ── Studio Details Panel (desktop slide-in / mobile bottom sheet) ── */}
      <StudioDetails
        studio={selectedStudio}
        onClose={handleCloseDetails}
      />
    </div>
  );
};

export default StudioFinder;
