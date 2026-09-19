import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, MapPin, SlidersHorizontal, Loader2, Navigation, ChevronDown } from 'lucide-react';
import api from '../api/axios';
import StudioMap from '../components/StudioMap';
import StudioCard from '../components/StudioCard';
import EmptyState from '../components/EmptyState';
import { toast } from '../components/Toast';

const MEDIUM_OPTIONS = [
  'All', 'Paintings', 'Portraits', 'Landscapes', 'Charcoal Drawings',
  'Pottery', 'Sculpture', 'Printmaking', 'Calligraphy', 'Digital Art',
];

const RADIUS_OPTIONS = [
  { value: 3000,  label: 'Within 3 km' },
  { value: 5000,  label: 'Within 5 km' },
  { value: 10000, label: 'Within 10 km' },
  { value: 20000, label: 'Within 20 km' },
  { value: 50000, label: 'Within 50 km' },
];

const Studios = () => {
  const [searchParams]    = useSearchParams();
  const [studios,         setStudios]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [userLocation,    setUserLocation]     = useState(null);
  const [selectedStudio,  setSelectedStudio]  = useState(null);
  const [locationSearch,  setLocationSearch]  = useState('');
  const [selectedMedium,  setSelectedMedium]  = useState(searchParams.get('medium') || 'All');
  const [radius,          setRadius]          = useState(10000);
  const [hasSearched,     setHasSearched]     = useState(false);

  const search = useCallback(async (lat, lon) => {
    setLoading(true);
    setHasSearched(true);
    setSelectedStudio(null);
    try {
      const params = new URLSearchParams({ lat, lon, radius });
      if (selectedMedium && selectedMedium !== 'All') params.set('medium', selectedMedium);
      const { data } = await api.get(`/studios/nearby?${params}`);
      setStudios(data.data || []);
      if (data.data?.length === 0) toast.info('No studios found nearby. Try expanding the radius.');
    } catch {
      toast.error('Failed to search studios. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [radius, selectedMedium]);

  const handleLocate = () => {
    if (!navigator.geolocation) { toast.error('Geolocation is not supported by your browser'); return; }
    toast.info('Getting your location…');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const loc = { lat: pos.coords.latitude, lon: pos.coords.longitude };
        setUserLocation(loc);
        search(loc.lat, loc.lon);
      },
      () => toast.error('Could not get your location. Please allow location access.')
    );
  };

  const handleLocationSearch = async (e) => {
    e.preventDefault();
    if (!locationSearch.trim()) return;
    try {
      const resp    = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearch)}&format=json&limit=1`);
      const results = await resp.json();
      if (results.length === 0) { toast.error('Location not found. Try a different search.'); return; }
      const loc = { lat: parseFloat(results[0].lat), lon: parseFloat(results[0].lon) };
      setUserLocation(loc);
      search(loc.lat, loc.lon);
    } catch {
      toast.error('Location search failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-cream">

      {/* ── Hero Search ── */}
      <header className="bg-art-gradient relative overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-hero-pattern opacity-30" aria-hidden="true" />
        {/* Ambient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-canvas-500/10 blur-3xl pointer-events-none" aria-hidden="true" />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full bg-terracotta-500/8 blur-3xl pointer-events-none" aria-hidden="true" />

        <div className="relative container-art py-16">
          <div className="max-w-3xl">
            <p className="eyebrow-light animate-fade-in">Near You</p>
            <h1 className="font-display font-bold text-5xl md:text-6xl text-white mb-4 animate-fade-up leading-tight">
              Find Art Studios
            </h1>
            <p className="text-charcoal-300 text-lg mb-8 max-w-xl animate-fade-up delay-100">
              Discover pottery classes, painting workshops, and creative spaces near your location.
            </p>

            {/* Search card */}
            <div className="bg-charcoal-900/70 backdrop-blur-md rounded-2xl p-5 border border-charcoal-700/60 space-y-4 animate-fade-up delay-200 shadow-dark-lg">
              {/* Location search */}
              <form onSubmit={handleLocationSearch} className="flex gap-2.5" role="search" aria-label="Studio location search">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-charcoal-400 pointer-events-none" aria-hidden="true" />
                  <input
                    type="text"
                    value={locationSearch}
                    onChange={e => setLocationSearch(e.target.value)}
                    placeholder="Search a city or area…"
                    aria-label="Enter location to search for studios"
                    className="input-dark pl-10 text-sm w-full"
                  />
                </div>
                <button type="submit" className="btn-primary px-5 shrink-0" aria-label="Search studios">
                  <Search className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Search</span>
                </button>
                <button
                  type="button"
                  onClick={handleLocate}
                  className="btn border border-charcoal-700 text-charcoal-300 hover:border-canvas-500 hover:text-canvas-300 px-4 transition-all shrink-0"
                  aria-label="Use my current location"
                >
                  <Navigation className="w-4 h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">My Location</span>
                </button>
              </form>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5" role="group" aria-label="Filter studios">
                <SlidersHorizontal className="w-4 h-4 text-charcoal-500 shrink-0" aria-hidden="true" />
                <div className="relative">
                  <select
                    value={selectedMedium}
                    onChange={e => setSelectedMedium(e.target.value)}
                    aria-label="Filter by art medium"
                    className="select-dark appearance-none pr-8 pl-3"
                  >
                    {MEDIUM_OPTIONS.map(m => <option key={m}>{m}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400 pointer-events-none" aria-hidden="true" />
                </div>
                <div className="relative">
                  <select
                    value={radius}
                    onChange={e => setRadius(Number(e.target.value))}
                    aria-label="Search radius"
                    className="select-dark appearance-none pr-8 pl-3"
                  >
                    {RADIUS_OPTIONS.map(({ value, label }) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal-400 pointer-events-none" aria-hidden="true" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Results ── */}
      <main className="container-art py-10">
        {!hasSearched ? (
          /* Initial state */
          <div className="text-center py-20 animate-fade-in">
            <div className="relative w-24 h-24 mx-auto mb-6">
              <div className="absolute inset-0 rounded-3xl bg-canvas-100 rotate-6" aria-hidden="true" />
              <div className="absolute inset-0 rounded-3xl bg-canvas-50 border border-canvas-100 flex items-center justify-center">
                <MapPin className="w-10 h-10 text-canvas-400" aria-hidden="true" />
              </div>
            </div>
            <h2 className="font-display font-bold text-2xl text-charcoal-800 mb-3">
              Discover Studios Near You
            </h2>
            <p className="text-charcoal-500 mb-7 max-w-sm mx-auto">
              Share your location or type a city to find art studios, pottery classes, and workshops nearby.
            </p>
            <button
              onClick={handleLocate}
              className="btn-primary"
              aria-label="Use my current location to find studios"
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              Use My Location
            </button>
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-20 gap-3 text-charcoal-500" aria-live="polite" aria-label="Searching for studios">
            <Loader2 className="w-5 h-5 animate-spin text-canvas-500" aria-hidden="true" />
            <span>Searching studios near you…</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Results list */}
            <div className="lg:col-span-2 space-y-3" aria-live="polite" aria-label={`${studios.length} studios found`}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-display font-semibold text-charcoal-900 text-lg">
                  {studios.length} Studio{studios.length !== 1 ? 's' : ''} Found
                </h2>
              </div>

              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1 scrollbar-hide">
                {studios.length === 0 ? (
                  <EmptyState
                    title="No studios found"
                    description="Try a different location or expand the search radius."
                  />
                ) : (
                  studios.map((studio, i) => (
                    <div
                      key={studio.externalPlaceId || studio._id || i}
                      className="animate-fade-up"
                      style={{ animationDelay: `${Math.min(i, 5) * 60}ms` }}
                    >
                      <StudioCard
                        studio={studio}
                        isSelected={selectedStudio?.externalPlaceId === studio.externalPlaceId}
                        onFocus={s => setSelectedStudio(s)}
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-3 h-[60vh] lg:h-[70vh] sticky top-20 rounded-2xl overflow-hidden border border-charcoal-200 shadow-card">
              <StudioMap
                studios={studios}
                userLocation={userLocation}
                selectedStudio={selectedStudio}
                onStudioSelect={setSelectedStudio}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Studios;
