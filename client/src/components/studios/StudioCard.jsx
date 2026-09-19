import { Star, MapPin, Navigation, Phone, Globe, Clock, ExternalLink } from 'lucide-react';

const distKm = (km) => {
  if (km == null) return null;
  return km < 1 ? `${(km * 1000).toFixed(0)} m` : `${km.toFixed(1)} km`;
};

/**
 * StudioCard — compact list card for the studio finder results panel.
 *
 * Props:
 *   studio      {object}   Normalized studio object
 *   isSelected  {boolean}  Whether this card is currently selected
 *   onSelect    {fn}       Called with studio when card is clicked
 */
const StudioCard = ({ studio, isSelected = false, onSelect }) => {
  const dist  = distKm(studio.distance);
  const photo = studio.photos?.[0];

  const handleDirections = (e) => {
    e.stopPropagation();
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${studio.latitude},${studio.longitude}`,
      '_blank', 'noopener,noreferrer'
    );
  };

  return (
    <article
      id={`studio-card-${studio.id || studio.externalPlaceId}`}
      className={`
        group relative bg-white rounded-2xl overflow-hidden border transition-all duration-200 cursor-pointer
        hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] hover:-translate-y-0.5
        ${isSelected
          ? 'border-canvas-400 shadow-[0_0_0_2px_rgba(212,137,42,0.25),0_8px_28px_rgba(0,0,0,0.12)] -translate-y-0.5'
          : 'border-charcoal-100 shadow-card'}
      `}
      onClick={() => onSelect?.(studio)}
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`${studio.name}${dist ? `, ${dist} away` : ''}`}
      onKeyDown={(e) => e.key === 'Enter' && onSelect?.(studio)}
    >
      <div className="flex gap-0 min-h-0">

        {/* Photo thumbnail */}
        {photo ? (
          <div className="w-24 shrink-0 relative overflow-hidden">
            <img
              src={photo}
              alt={studio.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => { e.target.parentElement.style.display = 'none'; }}
            />
            {/* Open/closed badge on photo */}
            {studio.openNow != null && (
              <span className={`absolute top-1.5 left-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                studio.openNow ? 'bg-emerald-500 text-white' : 'bg-charcoal-700 text-charcoal-300'
              }`}>
                {studio.openNow ? 'Open' : 'Closed'}
              </span>
            )}
          </div>
        ) : (
          /* Placeholder gradient when no photo */
          <div className="w-24 shrink-0 bg-gradient-to-br from-canvas-100 to-terracotta-50 flex items-center justify-center">
            <span className="text-2xl opacity-40" aria-hidden="true">🎨</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 p-3 flex flex-col gap-1.5">

          {/* Name */}
          <div className="flex items-start justify-between gap-1.5">
            <h3 className="font-display font-semibold text-sm text-charcoal-900 leading-snug line-clamp-2 flex-1">
              {studio.name}
            </h3>
            {isSelected && (
              <span className="shrink-0 w-2 h-2 rounded-full bg-canvas-500 mt-1" aria-hidden="true" />
            )}
          </div>

          {/* Address */}
          {studio.address && (
            <div className="flex items-start gap-1 text-xs text-charcoal-500">
              <MapPin className="w-3 h-3 text-terracotta-400 shrink-0 mt-0.5" aria-hidden="true" />
              <span className="line-clamp-1">{studio.address}</span>
            </div>
          )}

          {/* Rating + Distance + Hours row */}
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            {studio.rating && (
              <div className="flex items-center gap-0.5" aria-label={`Rating: ${studio.rating.toFixed(1)} out of 5`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    className={`w-3 h-3 ${i <= Math.round(studio.rating)
                      ? 'text-canvas-400 fill-canvas-400'
                      : 'text-charcoal-200 fill-charcoal-200'
                    }`}
                    aria-hidden="true"
                  />
                ))}
                <span className="text-xs font-semibold text-charcoal-700 ml-0.5">
                  {studio.rating.toFixed(1)}
                </span>
                {studio.totalRatings && (
                  <span className="text-[10px] text-charcoal-400 ml-0.5">({studio.totalRatings})</span>
                )}
              </div>
            )}
            {dist && (
              <span className="flex items-center gap-1 text-xs text-charcoal-500">
                <Navigation className="w-3 h-3 text-canvas-400" aria-hidden="true" />
                {dist}
              </span>
            )}
            {studio.hours && !studio.openNow && (
              <span className="flex items-center gap-1 text-xs text-charcoal-400">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span className="truncate max-w-[90px]">{studio.hours.length > 15 ? studio.hours.slice(0, 13) + '…' : studio.hours}</span>
              </span>
            )}
          </div>

          {/* Medium tags */}
          {studio.supportedMediums?.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {studio.supportedMediums.slice(0, 3).map((m) => (
                <span key={m} className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-canvas-50 text-canvas-700 border border-canvas-200 font-medium capitalize">
                  {m}
                </span>
              ))}
              {studio.supportedMediums.length > 3 && (
                <span className="inline-block px-2 py-0.5 rounded-full text-[10px] bg-charcoal-100 text-charcoal-500 font-medium">
                  +{studio.supportedMediums.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center gap-1.5 mt-auto pt-0.5">
            <button
              onClick={handleDirections}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-canvas-500 hover:bg-canvas-600 text-white text-[11px] font-semibold transition-colors"
              aria-label={`Get directions to ${studio.name}`}
            >
              <Navigation className="w-3 h-3" aria-hidden="true" />
              Directions
            </button>
            {studio.phone && (
              <a
                href={`tel:${studio.phone}`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Call ${studio.name}`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-charcoal-200 hover:border-canvas-400 hover:text-canvas-600 text-charcoal-600 text-[11px] font-medium transition-colors"
              >
                <Phone className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
            {studio.website && (
              <a
                href={studio.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Visit ${studio.name} website`}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-charcoal-200 hover:border-canvas-400 hover:text-canvas-600 text-charcoal-600 text-[11px] font-medium transition-colors"
              >
                <ExternalLink className="w-3 h-3" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default StudioCard;
