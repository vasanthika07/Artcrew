import { Star, MapPin, Navigation, Phone, Globe, Clock, X } from 'lucide-react';

const StudioCard = ({ studio, onFocus, isSelected, onClose }) => {
  const handleDirections = (e) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${studio.latitude},${studio.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const distanceLabel = studio.distance !== undefined
    ? studio.distance < 1
      ? `${(studio.distance * 1000).toFixed(0)} m away`
      : `${studio.distance.toFixed(1)} km away`
    : null;

  return (
    <article
      className={`card-location transition-all duration-200 ${
        isSelected
          ? 'ring-2 ring-canvas-500 shadow-art scale-[1.01]'
          : ''
      }`}
      onClick={() => onFocus?.(studio)}
      tabIndex={0}
      role="button"
      aria-pressed={isSelected}
      aria-label={`${studio.name}${distanceLabel ? `, ${distanceLabel}` : ''}`}
      onKeyDown={(e) => e.key === 'Enter' && onFocus?.(studio)}
    >
      {/* Photos strip */}
      {studio.photos?.length > 0 && (
        <div className="relative h-32 overflow-hidden">
          <img
            src={studio.photos[0]}
            alt={`${studio.name} studio`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/40 to-transparent" aria-hidden="true" />
          {studio.photos.length > 1 && (
            <div className="absolute bottom-2 right-2 flex gap-1.5">
              {studio.photos.slice(1, 3).map((p, i) => (
                <img
                  key={i}
                  src={p}
                  alt=""
                  aria-hidden="true"
                  className="w-10 h-10 rounded-lg object-cover border-2 border-white/60 shadow-sm"
                />
              ))}
            </div>
          )}
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              aria-label="Close studio details"
              className="absolute top-2 right-2 w-7 h-7 rounded-full bg-charcoal-950/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-charcoal-950/80 transition-colors"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Name + address */}
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display font-semibold text-charcoal-900 leading-snug flex-1">
              {studio.name}
            </h3>
            {!studio.photos?.length && onClose && (
              <button
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                aria-label="Close"
                className="p-1 rounded-lg hover:bg-charcoal-100 text-charcoal-400 transition-colors shrink-0"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>
          {studio.address && (
            <div className="flex items-start gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-terracotta-400 shrink-0 mt-0.5" aria-hidden="true" />
              <p className="text-xs text-charcoal-500 line-clamp-2">{studio.address}</p>
            </div>
          )}
        </div>

        {/* Rating + Distance + Hours */}
        <div className="flex flex-wrap items-center gap-2.5 mb-3">
          {studio.rating && (
            <div className="flex items-center gap-1" aria-label={`Rating: ${studio.rating.toFixed(1)} out of 5`}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-3 h-3 ${i < Math.round(studio.rating) ? 'text-canvas-400 fill-canvas-400' : 'text-charcoal-200 fill-charcoal-200'}`}
                  aria-hidden="true"
                />
              ))}
              <span className="text-xs font-semibold text-charcoal-700 ml-0.5">{studio.rating.toFixed(1)}</span>
            </div>
          )}
          {distanceLabel && (
            <span className="flex items-center gap-1 text-xs text-charcoal-500">
              <Navigation className="w-3 h-3 text-canvas-400" aria-hidden="true" />
              {distanceLabel}
            </span>
          )}
          {studio.hours && (
            <span className="flex items-center gap-1 text-xs text-charcoal-400">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span className="truncate max-w-[120px]">{studio.hours.length > 20 ? studio.hours.slice(0, 18) + '…' : studio.hours}</span>
            </span>
          )}
        </div>

        {/* Medium tags */}
        {studio.supportedMediums?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {studio.supportedMediums.slice(0, 4).map((m) => (
              <span key={m} className="tag text-[11px]">{m}</span>
            ))}
            {studio.supportedMediums.length > 4 && (
              <span className="tag text-[11px] text-charcoal-400">+{studio.supportedMediums.length - 4}</span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 flex-wrap pt-1">
          <button
            onClick={handleDirections}
            className="btn-primary btn-sm flex-1 justify-center min-w-0"
            aria-label={`Get directions to ${studio.name}`}
          >
            <Navigation className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span className="truncate">Directions</span>
          </button>
          <div className="flex gap-1.5 shrink-0">
            {studio.phone && (
              <a
                href={`tel:${studio.phone}`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Call ${studio.name}`}
                className="btn-outline btn-sm px-2.5"
              >
                <Phone className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
            {studio.website && (
              <a
                href={studio.website}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                aria-label={`Visit ${studio.name} website`}
                className="btn-outline btn-sm px-2.5"
              >
                <Globe className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            )}
          </div>
        </div>
      </div>
    </article>
  );
};

export default StudioCard;
