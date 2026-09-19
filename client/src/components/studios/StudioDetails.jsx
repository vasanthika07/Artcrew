import { useEffect, useRef, useState } from 'react';
import {
  X, MapPin, Star, Clock, Phone, Globe, Navigation,
  ChevronLeft, ChevronRight, ExternalLink, Tag, Layers
} from 'lucide-react';

const distanceLabel = (km) => {
  if (km == null) return null;
  return km < 1
    ? `${(km * 1000).toFixed(0)} m away`
    : `${km.toFixed(1)} km away`;
};

const DirectionsUrl = (lat, lon, name) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}&destination_place_id=${encodeURIComponent(name)}`;

/**
 * Photo carousel sub-component.
 */
const PhotoCarousel = ({ photos, name }) => {
  const [current, setCurrent] = useState(0);
  if (!photos?.length) return null;

  const prev = () => setCurrent((c) => (c === 0 ? photos.length - 1 : c - 1));
  const next = () => setCurrent((c) => (c === photos.length - 1 ? 0 : c + 1));

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-charcoal-100">
      <img
        src={photos[current]}
        alt={`${name} — photo ${current + 1}`}
        className="w-full h-full object-cover"
        loading="lazy"
        onError={(e) => { e.target.style.display = 'none'; }}
      />

      {photos.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label="Previous photo"
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-charcoal-950/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-charcoal-950/80 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={next}
            aria-label="Next photo"
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-charcoal-950/60 backdrop-blur-sm text-white flex items-center justify-center hover:bg-charcoal-950/80 transition-colors"
          >
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </button>

          {/* Dots */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5" aria-hidden="true">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === current ? 'bg-white w-4' : 'bg-white/50'
                }`}
              />
            ))}
          </div>

          {/* Counter */}
          <div className="absolute top-2 right-2 badge-dark badge text-[11px]">
            {current + 1} / {photos.length}
          </div>
        </>
      )}
    </div>
  );
};

/**
 * StudioDetails — slide-in panel for desktop, bottom sheet for mobile.
 *
 * Props:
 *   studio   {object|null}  Studio to display; null = closed
 *   onClose  {fn}           Called when the panel is dismissed
 */
const StudioDetails = ({ studio, onClose }) => {
  const panelRef = useRef(null);
  const open     = !!studio;

  // Trap focus within the panel when open
  useEffect(() => {
    if (open && panelRef.current) {
      const focusable = panelRef.current.querySelectorAll(
        'button, a, input, [tabindex]:not([tabindex="-1"])'
      );
      focusable[0]?.focus();
    }
  }, [open, studio]);

  // Close on ESC
  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!studio) return null;

  const dist    = distanceLabel(studio.distance);
  const dirUrl  = DirectionsUrl(studio.latitude, studio.longitude, studio.name);

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-charcoal-950/50 backdrop-blur-sm z-30 lg:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — slides in from right on desktop, up from bottom on mobile */}
      <aside
        ref={panelRef}
        role="complementary"
        aria-label={`Studio details: ${studio.name}`}
        className={`
          fixed z-40 bg-white shadow-dark-lg
          transition-transform duration-300 ease-spring
          ${open ? 'translate-x-0 translate-y-0' : 'translate-x-full translate-y-full'}

          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0 rounded-t-3xl max-h-[85vh] overflow-y-auto
          lg:top-0 lg:right-0 lg:bottom-0 lg:left-auto
          lg:w-96 lg:max-h-none lg:rounded-none lg:rounded-l-3xl
          lg:translate-y-0
          ${open ? 'lg:translate-x-0' : 'lg:translate-x-full'}
        `}
      >
        {/* Close handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 lg:hidden" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-charcoal-200" />
        </div>

        {/* Photo carousel */}
        <PhotoCarousel photos={studio.photos} name={studio.name} />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close studio details"
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-charcoal-950/60 backdrop-blur-sm
            text-white flex items-center justify-center hover:bg-charcoal-950/80 transition-colors z-10"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Content */}
        <div className="p-5">
          {/* Name + source badge */}
          <div className="flex items-start justify-between gap-3 mb-3">
            <h2 className="font-display font-bold text-xl text-charcoal-900 leading-snug">
              {studio.name}
            </h2>
            <span
              className={`badge shrink-0 mt-1 ${
                studio.source === 'google' ? 'bg-blue-50 text-blue-700' : 'bg-charcoal-100 text-charcoal-600'
              }`}
            >
              {studio.source === 'google' ? 'Google' : studio.source === 'overpass' ? 'OSM' : 'Verified'}
            </span>
          </div>

          {/* Rating */}
          {studio.rating && (
            <div className="flex items-center gap-2 mb-3" aria-label={`Rating: ${studio.rating.toFixed(1)} out of 5`}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-4 h-4 ${
                    i <= Math.round(studio.rating)
                      ? 'text-canvas-400 fill-canvas-400'
                      : 'text-charcoal-200 fill-charcoal-200'
                  }`}
                  aria-hidden="true"
                />
              ))}
              <span className="text-sm font-semibold text-charcoal-800">
                {studio.rating.toFixed(1)}
              </span>
              {studio.totalRatings && (
                <span className="text-xs text-charcoal-400">({studio.totalRatings.toLocaleString()} reviews)</span>
              )}
            </div>
          )}

          {/* Info rows */}
          <div className="space-y-2.5 mb-5">
            {studio.address && (
              <div className="flex items-start gap-2.5 text-sm text-charcoal-600">
                <MapPin className="w-4 h-4 text-terracotta-400 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{studio.address}</span>
              </div>
            )}
            {dist && (
              <div className="flex items-center gap-2.5 text-sm text-charcoal-500">
                <Navigation className="w-4 h-4 text-canvas-400 shrink-0" aria-hidden="true" />
                <span>{dist}</span>
              </div>
            )}
            {studio.hours && (
              <div className="flex items-center gap-2.5 text-sm">
                <Clock className="w-4 h-4 text-charcoal-400 shrink-0" aria-hidden="true" />
                <span className={studio.openNow === true ? 'text-sage-600 font-medium' : studio.openNow === false ? 'text-red-500' : 'text-charcoal-600'}>
                  {studio.hours}
                </span>
              </div>
            )}
            {studio.phone && (
              <div className="flex items-center gap-2.5 text-sm text-charcoal-600">
                <Phone className="w-4 h-4 text-charcoal-400 shrink-0" aria-hidden="true" />
                <a href={`tel:${studio.phone}`} className="hover:text-canvas-600 transition-colors">
                  {studio.phone}
                </a>
              </div>
            )}
            {studio.website && (
              <div className="flex items-center gap-2.5 text-sm text-charcoal-600">
                <Globe className="w-4 h-4 text-charcoal-400 shrink-0" aria-hidden="true" />
                <a
                  href={studio.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate hover:text-canvas-600 transition-colors text-canvas-600 font-medium"
                >
                  Visit Website
                  <ExternalLink className="w-3 h-3 inline ml-1" aria-hidden="true" />
                </a>
              </div>
            )}
          </div>

          {/* Description */}
          {studio.description && (
            <div className="mb-5 p-4 bg-canvas-50 rounded-2xl border border-canvas-100">
              <p className="text-sm text-charcoal-700 leading-relaxed">{studio.description}</p>
            </div>
          )}

          {/* Mediums */}
          {studio.supportedMediums?.length > 0 && (
            <div className="mb-5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 uppercase tracking-wider mb-2">
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                Art Mediums
              </div>
              <div className="flex flex-wrap gap-1.5">
                {studio.supportedMediums.map((m) => (
                  <span key={m} className="tag capitalize">{m}</span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <a
              href={dirUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary justify-center"
              aria-label={`Get directions to ${studio.name}`}
            >
              <Navigation className="w-4 h-4" aria-hidden="true" />
              Get Directions
            </a>

            <div className="grid grid-cols-2 gap-2">
              {studio.phone && (
                <a
                  href={`tel:${studio.phone}`}
                  className="btn-outline btn-sm justify-center"
                  aria-label={`Call ${studio.name}`}
                >
                  <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                  Call
                </a>
              )}
              {studio.website && (
                <a
                  href={studio.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-outline btn-sm justify-center"
                  aria-label={`Visit ${studio.name} website`}
                >
                  <Globe className="w-3.5 h-3.5" aria-hidden="true" />
                  Website
                </a>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default StudioDetails;
